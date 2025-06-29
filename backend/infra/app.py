#!/usr/bin/env python3
import aws_cdk as cdk
from backend_stack import BackendStack

app = cdk.App()
BackendStack(app, "BackendStack", env=cdk.Environment(region="us-east-1"))
app.synth()
