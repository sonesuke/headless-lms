import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as appsync from "aws-cdk-lib/aws-appsync";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as logs from "aws-cdk-lib/aws-logs";
import * as path from "path";

// import * as sqs from 'aws-cdk-lib/aws-sqs';

export class ApiStack extends cdk.Stack {

  public api: appsync.GraphqlApi;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const api = new appsync.GraphqlApi(this, "Api", {
      name: "headless-lms",
      schema: appsync.SchemaFile.fromAsset(
        path.join(__dirname, "graphql/schema.graphql")
      ),
      authorizationConfig: {
        defaultAuthorization: {
          authorizationType: appsync.AuthorizationType.IAM,
        },
      },
      xrayEnabled: true,
      logConfig: {
        fieldLogLevel: appsync.FieldLogLevel.ALL,
        retention: logs.RetentionDays.ONE_WEEK,
      },
    });
    this.api = api;

    const unitTable = new dynamodb.Table(this, "UnitTable", {
      tableName: "HLLMS_Unit",
      partitionKey: {
        name: "id",
        type: dynamodb.AttributeType.STRING,
      },
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const moduleTable = new dynamodb.Table(this, "ModuleTable", {
      tableName: "HLLMS_Module",
      partitionKey: {
        name: "id",
        type: dynamodb.AttributeType.STRING,
      },
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const userTable = new dynamodb.Table(this, "UserTable", {
      tableName: "HLLMS_User",
      partitionKey: {
        name: "id",
        type: dynamodb.AttributeType.STRING,
      },
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const historyTable = new dynamodb.Table(this, "HistoryTable", {
      tableName: "HLLMS_History",
      partitionKey: {
        name: "userId",
        type: dynamodb.AttributeType.STRING,
      },
      sortKey: {
        name: "unitId",
        type: dynamodb.AttributeType.STRING,
      },
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const unitDataSource = api.addDynamoDbDataSource(
      "UnitDataSource",
      unitTable
    );

    unitDataSource.createResolver("QueryGetUnit", {
      typeName: "Query",
      fieldName: "getUnit",
      requestMappingTemplate: appsync.MappingTemplate.dynamoDbQuery(
        appsync.KeyCondition.eq("id", "id")
      ),
      responseMappingTemplate: appsync.MappingTemplate.dynamoDbResultList(),
    });

    const moduleDataSource = api.addDynamoDbDataSource(
      "ModuleDataSource",
      moduleTable
    );

    moduleDataSource.createResolver("QueryGetAllModule", {
      typeName: "Query",
      fieldName: "getAllModule",
      requestMappingTemplate: appsync.MappingTemplate.dynamoDbScanTable(),
      responseMappingTemplate: appsync.MappingTemplate.dynamoDbResultList(),
    });

    moduleDataSource.createResolver("QueryGetModule", {
      typeName: "Query",
      fieldName: "getModule",
      requestMappingTemplate: appsync.MappingTemplate.dynamoDbQuery(
        appsync.KeyCondition.eq("id", "id")
      ),
      responseMappingTemplate: appsync.MappingTemplate.dynamoDbResultList(),
    });

    const userDataSource = api.addDynamoDbDataSource(
      "UserDataSource",
      userTable
    );

    userDataSource.createResolver("QueryGetUser", {
      typeName: "Query",
      fieldName: "getUser",
      requestMappingTemplate: appsync.MappingTemplate.dynamoDbQuery(
        appsync.KeyCondition.eq("id", "id")
      ),
      responseMappingTemplate: appsync.MappingTemplate.dynamoDbResultList(),
    });

    const historyDataSource = api.addDynamoDbDataSource(
      "HistoryDataSource",
      historyTable
    );

    historyDataSource.createResolver("QueryGetAllHistory", {
      typeName: "Query",
      fieldName: "getUserHistory",
      requestMappingTemplate: appsync.MappingTemplate.dynamoDbQuery(
        appsync.KeyCondition.eq("userId", "userId")
      ),
      responseMappingTemplate: appsync.MappingTemplate.dynamoDbResultList(),
    });

    historyDataSource.createResolver("QueryGetHistory", {
      typeName: "Query",
      fieldName: "getHistory",
      requestMappingTemplate: appsync.MappingTemplate.dynamoDbQuery(
        appsync.KeyCondition.eq("userId", "userId").and(
          appsync.KeyCondition.eq("unitId", "unitId")
        )
      ),
      responseMappingTemplate: appsync.MappingTemplate.dynamoDbResultList()
    });

    historyDataSource.createResolver("MutationPushHistory", {
      typeName: "Mutation",
      fieldName: "pushHistory",
      requestMappingTemplate: appsync.MappingTemplate.fromString(`
        {
            "version" : "2017-02-28",
            "operation" : "PutItem",
            "key" : {
                "userId" : \$util.dynamodb.toDynamoDBJson(\$ctx.args.userId),
                "unitId" : \$util.dynamodb.toDynamoDBJson(\$ctx.args.unitId)
            },
            "attributeValues" : {
                "updatedAt" : \$util.dynamodb.toDynamoDBJson(\$util.time.nowISO8601()),
                "progress" : \$util.dynamodb.toDynamoDBJson(\$ctx.args.progress),
                "data" : \$util.dynamodb.toDynamoDBJson(\$ctx.args.data)
            }
        }`),
      responseMappingTemplate: appsync.MappingTemplate.dynamoDbResultItem(),
    });
  }
}
