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
      xrayEnabled: true,
      logConfig: {
        fieldLogLevel: appsync.FieldLogLevel.ALL,
        retention: logs.RetentionDays.ONE_WEEK,
      },
    });
    this.api = api;

    const moduleTable = new dynamodb.Table(this, "ModuleTable", {
      tableName: "Module",
      partitionKey: {
        name: "id",
        type: dynamodb.AttributeType.STRING,
      },
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const userTable = new dynamodb.Table(this, "UserTable", {
      tableName: "User",
      partitionKey: {
        name: "id",
        type: dynamodb.AttributeType.STRING,
      },
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const historyTable = new dynamodb.Table(this, "HistoryTable", {
      tableName: "History",
      partitionKey: {
        name: "userId",
        type: dynamodb.AttributeType.STRING,
      },
      sortKey: {
        name: "moduleId",
        type: dynamodb.AttributeType.STRING,
      },
      removalPolicy: cdk.RemovalPolicy.DESTROY,
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
      requestMappingTemplate: appsync.MappingTemplate.dynamoDbGetItem(
        "id",
        "id"
      ),
      responseMappingTemplate: appsync.MappingTemplate.dynamoDbResultItem(),
    });

    const userDataSource = api.addDynamoDbDataSource(
      "UserDataSource",
      userTable
    );

    userDataSource.createResolver("QueryGetUser", {
      typeName: "Query",
      fieldName: "getUser",
      requestMappingTemplate: appsync.MappingTemplate.dynamoDbGetItem(
        "id",
        "id"
      ),
      responseMappingTemplate: appsync.MappingTemplate.dynamoDbResultItem(),
    });

    const historyDataSource = api.addDynamoDbDataSource(
      "HistoryDataSource",
      historyTable
    );

    historyDataSource.createResolver("QueryGetAllHistory", {
      typeName: "Query",
      fieldName: "getAllHistory",
      requestMappingTemplate: appsync.MappingTemplate.dynamoDbQuery(
        appsync.KeyCondition.eq("userId", "userId")
      ),
      responseMappingTemplate: appsync.MappingTemplate.dynamoDbResultList(),
    });

    historyDataSource.createResolver("QueryGetLatestHistory", {
      typeName: "Query",
      fieldName: "getLatestHistory",
      requestMappingTemplate: appsync.MappingTemplate.dynamoDbQuery(
        appsync.KeyCondition.eq("userId", "userId").and(
          appsync.KeyCondition.eq("moduleId", "moduleId")
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
                "moduleId" : \$util.dynamodb.toDynamoDBJson(\$ctx.args.moduleId)
            },
            "attributeValues" : {
                "updatedAt" : \$util.dynamodb.toDynamoDBJson(\$util.time.nowISO8601()),
                "data" : \$util.dynamodb.toDynamoDBJson(\$ctx.args.data)
            }
        }`),
      responseMappingTemplate: appsync.MappingTemplate.dynamoDbResultItem(),
    });
  }
}
