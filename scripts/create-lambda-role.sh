#!/bin/bash

# Crear el rol de ejecución para Lambda
echo "Creating Lambda execution role..."

# Crear el trust policy
cat > trust-policy.json << EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "lambda.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
EOF

# Crear el rol
aws iam create-role \
  --role-name lambda-execution-role \
  --assume-role-policy-document file://trust-policy.json \
  --description "Execution role for menu-generator Lambda"

# Adjuntar políticas necesarias
aws iam attach-role-policy \
  --role-name lambda-execution-role \
  --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole

aws iam attach-role-policy \
  --role-name lambda-execution-role \
  --policy-arn arn:aws:iam::aws:policy/AmazonKeyspacesReadOnlyAccess

# Crear política personalizada para Keyspaces write
cat > keyspaces-write-policy.json << EOF
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "cassandra:Select",
                "cassandra:Insert",
                "cassandra:Update"
            ],
            "Resource": "*"
        }
    ]
}
EOF

aws iam put-role-policy \
  --role-name lambda-execution-role \
  --policy-name KeyspacesWriteAccess \
  --policy-document file://keyspaces-write-policy.json

echo "✅ Lambda execution role created successfully"

# Limpiar archivos temporales
rm trust-policy.json keyspaces-write-policy.json