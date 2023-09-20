#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { VODStack } from '../lib/vod-stack';

const app = new cdk.App();
new VODStack(app, 'VODStack');

