from aws_cdk import (
    Stack,
    aws_ecs as ecs,
    aws_ecs_patterns as ecs_patterns,
    aws_ecr as ecr,
    aws_secretsmanager as secretsmanager,
    aws_route53 as route53,
    aws_route53_targets as targets,
    aws_elasticloadbalancingv2 as elbv2,
    aws_logs as logs,
    Duration,
    RemovalPolicy,
)
from constructs import Construct


class BackendStack(Stack):
    def __init__(self, scope: Construct, id: str, **kwargs) -> None:
        super().__init__(scope, id, **kwargs)

        domain = self.node.try_get_context("domain") or "feelfwd.app"
        api_domain = self.node.try_get_context("apiDomain") or "api.feelfwd.app"

        # Create or get the hosted zone for the domain
        zone = route53.HostedZone(
            self, 
            "HostedZone", 
            zone_name=domain
        )

        # Create ECR repository for the Docker image
        repository = ecr.Repository(
            self,
            "FeelForwardRepository",
            repository_name="feel-forward",
            removal_policy=RemovalPolicy.DESTROY,
            image_scan_on_push=True,
        )

        # Create secret for OpenAI API key
        openai_secret = secretsmanager.Secret(
            self,
            "OpenAISecret",
            secret_name="feel-forward/openai-api-key",
            description="OpenAI API key for Feel Forward backend",
        )

        # Create ECS cluster
        cluster = ecs.Cluster(
            self,
            "FeelForwardCluster",
            cluster_name="feel-forward",
            vpc=None,  # Use default VPC
        )

        # Create log group
        log_group = logs.LogGroup(
            self,
            "FeelForwardLogs",
            log_group_name="/ecs/feel-forward",
            retention=logs.RetentionDays.ONE_WEEK,
            removal_policy=RemovalPolicy.DESTROY,
        )

        # Create Fargate service with load balancer
        fargate_service = ecs_patterns.ApplicationLoadBalancedFargateService(
            self,
            "FeelForwardService",
            cluster=cluster,
            cpu=256,
            memory_limit_mib=512,
            desired_count=1,
            task_image_options=ecs_patterns.ApplicationLoadBalancedTaskImageOptions(
                image=ecs.ContainerImage.from_ecr_repository(repository, "latest"),
                container_port=8000,
                environment={
                    "PYTHONUNBUFFERED": "1",
                },
                secrets={
                    "OPENAI_API_KEY": ecs.Secret.from_secrets_manager(openai_secret),
                },
                log_driver=ecs.LogDriver.aws_logs(
                    log_group=log_group,
                    stream_prefix="feel-forward",
                ),
            ),
            public_load_balancer=True,
            listener_port=80,
            health_check_grace_period=Duration.seconds(60),
        )

        # Configure auto scaling
        scaling = fargate_service.service.auto_scale_task_count(
            max_capacity=3,
            min_capacity=1,
        )

        scaling.scale_on_cpu_utilization(
            "CpuScaling",
            target_utilization_percent=70,
            scale_in_cooldown=Duration.seconds(60),
            scale_out_cooldown=Duration.seconds(60),
        )

        # Create Route53 records for the domain
        route53.ARecord(
            self,
            "ApiRecord",
            zone=zone,
            record_name="api",
            target=route53.RecordTarget.from_alias(
                targets.LoadBalancerTarget(fargate_service.load_balancer)
            ),
        )

        # Create www subdomain record
        route53.CnameRecord(
            self, 
            "WWW", 
            zone=zone, 
            record_name="www", 
            domain_name=domain
        )

        # Output important values
        self.repository_uri = repository.repository_uri
        self.service_url = f"http://{fargate_service.load_balancer.load_balancer_dns_name}"
        self.api_url = f"https://{api_domain}"
        self.zone_id = zone.hosted_zone_id 