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
    Environment,
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
        task_definition = ecs.FargateTaskDefinition(
            self,
            "FeelForwardTaskDef",
            cpu=256,
            memory_limit_mib=512,
        )

        # Add container to task definition
        container = task_definition.add_container(
            "web",
            image=ecs.ContainerImage.from_ecr_repository(repository, "latest"),
            port_mappings=[ecs.PortMapping(container_port=8000)],
            environment={
                "PYTHONUNBUFFERED": "1",
            },
            secrets={
                "OPENAI_API_KEY": ecs.Secret.from_secrets_manager(openai_secret),
            },
            logging=ecs.LogDriver.aws_logs(
                log_group=log_group,
                stream_prefix="feel-forward",
            ),
        )

        fargate_service = ecs.FargateService(
            self,
            "FeelForwardService",
            cluster=cluster,
            task_definition=task_definition,
            desired_count=1,  # Scale up to 1 task now that image is available
            assign_public_ip=True,  # Allow public IP for internet access
        )

        # Create Application Load Balancer
        lb = elbv2.ApplicationLoadBalancer(
            self,
            "FeelForwardLB",
            vpc=cluster.vpc,
            internet_facing=True,
        )

        # Create target group
        target_group = elbv2.ApplicationTargetGroup(
            self,
            "FeelForwardTargetGroup",
            vpc=cluster.vpc,
            port=8000,
            protocol=elbv2.ApplicationProtocol.HTTP,
            target_type=elbv2.TargetType.IP,
            health_check=elbv2.HealthCheck(
                path="/health",
                port="8000",
                protocol=elbv2.Protocol.HTTP,
                healthy_threshold_count=2,
                unhealthy_threshold_count=2,
                timeout=Duration.seconds(5),
                interval=Duration.seconds(30),
            ),
        )

        # Add listener
        listener = lb.add_listener(
            "Listener",
            port=80,
            default_target_groups=[target_group],
        )

        # Attach service to target group
        fargate_service.attach_to_application_target_group(target_group)

        # Configure auto scaling
        scaling = fargate_service.auto_scale_task_count(
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
                targets.LoadBalancerTarget(lb)
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
        self.service_url = f"http://{lb.load_balancer_dns_name}"
        self.api_url = f"https://{api_domain}"
        self.zone_id = zone.hosted_zone_id 