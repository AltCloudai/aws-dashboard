
import {
  DescribeInstancesCommand,
  DescribeInstanceStatusCommand,
  RunInstancesCommand,
  StartInstancesCommand,
  StopInstancesCommand,
  RebootInstancesCommand,
  ModifyInstanceAttributeCommand,
  TerminateInstancesCommand
} from "@aws-sdk/client-ec2";

import { ec2 } from "../config/aws.js";

// Helper: validate instance ID
const validateInstanceId = (instanceId) => {
  if (!instanceId || !/^i-[a-f0-9]+$/i.test(instanceId)) {
    throw new Error("A valid EC2 instance ID is required");
  }
};

const allowedValues = (value) =>
  value ? value.split(",").map((item) => item.trim()).filter(Boolean) : [];

const allowedAmis = allowedValues(process.env.ALLOWED_AMIS || process.env.AMI_ID);
const allowedInstanceTypes = allowedValues(process.env.ALLOWED_INSTANCE_TYPES || process.env.INSTANCE_TYPE);
const allowedSubnets = allowedValues(process.env.ALLOWED_SUBNETS || process.env.SUBNET_ID);
const allowedSecurityGroups = allowedValues(process.env.ALLOWED_SECURITY_GROUPS || process.env.SECURITY_GROUP_ID);
const allowedKeyNames = allowedValues(process.env.ALLOWED_KEY_NAMES || process.env.KEY_NAME);

// 1. LIST INSTANCES
export const listInstances = async (req, res) => {
  const data = await ec2.send(
    new DescribeInstancesCommand({})
  );

  const instances = (data.Reservations || []).flatMap(
    reservation => reservation.Instances || []
  );

  res.json({
    success: true,
    instances
  });
};


// 2. CHECK INSTANCE HEALTH
export const checkInstanceHealth = async (req, res) => {
  const { instanceId } = req.params;

  validateInstanceId(instanceId);

  const data = await ec2.send(
    new DescribeInstanceStatusCommand({
      InstanceIds: [instanceId],
      IncludeAllInstances: true
    })
  );

  res.json({
    success: true,
    statuses: data.InstanceStatuses || []
  });
};


// 3. LAUNCH INSTANCE
export const launchInstance = async (req, res) => {
  const imageId = req.body.imageId || process.env.AMI_ID;
  const instanceType = req.body.instanceType || process.env.INSTANCE_TYPE;
  const subnetId = req.body.subnetId || process.env.SUBNET_ID;
  const keyName = req.body.keyName || process.env.KEY_NAME;
  const securityGroupIds = Array.isArray(req.body.securityGroupIds) && req.body.securityGroupIds.length
    ? req.body.securityGroupIds
    : (process.env.SECURITY_GROUP_ID ? [process.env.SECURITY_GROUP_ID] : []);

  if (
    !imageId ||
    !instanceType ||
    !subnetId ||
    !securityGroupIds.length ||
    !keyName
  ) {
    return res.status(400).json({
      success: false,
      message: "AMI, instance type, subnet, security groups and key pair are required"
    });
  }

  if (
    (allowedAmis.length && !allowedAmis.includes(imageId)) ||
    (allowedInstanceTypes.length && !allowedInstanceTypes.includes(instanceType)) ||
    (allowedSubnets.length && !allowedSubnets.includes(subnetId)) ||
    (allowedKeyNames.length && !allowedKeyNames.includes(keyName)) ||
    (allowedSecurityGroups.length &&
      !securityGroupIds.every((groupId) => allowedSecurityGroups.includes(groupId)))
  ) {
    return res.status(403).json({
      success: false,
      message: "Launch parameters are not approved"
    });
  }

  const data = await ec2.send(
    new RunInstancesCommand({
      ImageId: imageId,
      InstanceType: instanceType,
      SubnetId: subnetId,
      SecurityGroupIds: securityGroupIds,
      KeyName: keyName,
      MinCount: 1,
      MaxCount: 1
    })
  );

  res.status(201).json({
    success: true,
    message: "EC2 instance launch requested",
    instances: data.Instances || []
  });
};


// 4. START INSTANCE
export const startInstance = async (req, res) => {
  const { instanceId } = req.params;

  validateInstanceId(instanceId);

  const data = await ec2.send(
    new StartInstancesCommand({
      InstanceIds: [instanceId]
    })
  );

  res.json({
    success: true,
    message: "Start request submitted",
    instances: data.StartingInstances || []
  });
};


// 5. STOP INSTANCE
export const stopInstance = async (req, res) => {
  const { instanceId } = req.params;

  validateInstanceId(instanceId);

  const data = await ec2.send(
    new StopInstancesCommand({
      InstanceIds: [instanceId]
    })
  );

  res.json({
    success: true,
    message: "Stop request submitted",
    instances: data.StoppingInstances || []
  });
};


// 6. REBOOT INSTANCE
export const rebootInstance = async (req, res) => {
  const { instanceId } = req.params;

  validateInstanceId(instanceId);

  const data = await ec2.send(
    new RebootInstancesCommand({
      InstanceIds: [instanceId]
    })
  );

  res.json({
    success: true,
    message: "Reboot request submitted",
    result: data
  });
};


// 7. MODIFY INSTANCE TYPE
export const modifyInstanceType = async (req, res) => {
  const { instanceId } = req.params;
  const { instanceType } = req.body;

  validateInstanceId(instanceId);

  if (!instanceType) {
    return res.status(400).json({
      success: false,
      message: "Instance type is required"
    });
  }

  if (allowedInstanceTypes.length && !allowedInstanceTypes.includes(instanceType)) {
    return res.status(403).json({
      success: false,
      message: "Instance type is not approved"
    });
  }

  const data = await ec2.send(
    new ModifyInstanceAttributeCommand({
      InstanceId: instanceId,
      InstanceType: {
        Value: instanceType
      }
    })
  );

  res.json({
    success: true,
    message: "Instance type modification requested",
    result: data
  });
};


// 8. TERMINATE INSTANCE
export const terminateInstance = async (req, res) => {
  const { instanceId } = req.params;

  validateInstanceId(instanceId);

  if (req.body.confirm !== true) {
    return res.status(400).json({
      success: false,
      message: "Explicit termination confirmation is required"
    });
  }

  const data = await ec2.send(
    new TerminateInstancesCommand({
      InstanceIds: [instanceId]
    })
  );

  res.json({
    success: true,
    message: "Termination request submitted",
    instances: data.TerminatingInstances || []
  });
};
