from aws_cdk import (
    Stack,
    aws_s3 as s3,
    aws_cloudfront as cloudfront,
    aws_cloudfront_origins as origins,
    aws_route53 as route53,
    aws_route53_targets as targets,
)
from constructs import Construct

class FrontendStack(Stack):
    def __init__(self, scope: Construct, id: str, **kwargs) -> None:
        super().__init__(scope, id, **kwargs)

        domain = self.node.try_get_context("domain") or "feelfwd.app"
        api_domain = self.node.try_get_context("apiDomain") or "api.example.com"

        zone = route53.HostedZone(self, "HostedZone", zone_name=domain)

        bucket = s3.Bucket(
            self,
            "StaticSite",
            website_index_document="index.html",
            public_read_access=False,
            block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
        )

        distribution = cloudfront.Distribution(
            self,
            "Distribution",
            default_behavior=cloudfront.BehaviorOptions(
                origin=origins.S3Origin(bucket),
                viewer_protocol_policy=cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
            ),
        )

        route53.ARecord(
            self,
            "RootAlias",
            zone=zone,
            target=route53.RecordTarget.from_alias(targets.CloudFrontTarget(distribution)),
        )

        route53.CnameRecord(self, "WWW", zone=zone, record_name="www", domain_name=domain)

        route53.CnameRecord(
            self,
            "ApiAlias",
            zone=zone,
            record_name="api",
            domain_name=api_domain,
        )

        self.bucket_name = bucket.bucket_name
        self.cloudfront_domain = distribution.distribution_domain_name
