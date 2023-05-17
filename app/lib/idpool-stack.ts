import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as appsync from "aws-cdk-lib/aws-appsync";
import * as idpool from '@aws-cdk/aws-cognito-identitypool-alpha';


interface IdentityPoolProps extends cdk.StackProps {
  readonly api: appsync.IGraphqlApi;
};

export class IdPoolStack extends cdk.Stack {

  constructor(scope: Construct, id: string, props: IdentityPoolProps) {
    super(scope, id, props);

    const idPool = new idpool.IdentityPool(this, 'IdPool', {
      identityPoolName: 'headless-lms',
      allowUnauthenticatedIdentities: true,
    });

    idPool.unauthenticatedRole.addToPrincipalPolicy(new iam.PolicyStatement({
      actions: ['appsync:GraphQL'],
      resources: [
        props.api.arn + '/types/Query/fields/*',
        props.api.arn + '/types/Mutation/fields/*',
      ],
    }));
  } 
}