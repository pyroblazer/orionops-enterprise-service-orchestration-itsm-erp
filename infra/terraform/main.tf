terraform {
  required_version = ">= 1.6"
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 3.100"
    }
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = "~> 2.30"
    }
  }

  backend "local" {
    path = "terraform.tfstate"
  }
}

provider "azurerm" {
  features {}
}

provider "kubernetes" {
  config_path = "~/.kube/config"
}

# ---- Variables ----
variable "environment" {
  description = "Deployment environment"
  type        = string
  default     = "dev"
}

variable "location" {
  description = "Azure region"
  type        = string
  default     = "East US"
}

variable "resource_group_name" {
  description = "Resource group name"
  type        = string
  default     = "orionops-rg"
}

variable "cluster_name" {
  description = "AKS cluster name"
  type        = string
  default     = "orionops-aks"
}

variable "db_username" {
  description = "PostgreSQL admin username"
  type        = string
  default     = "orionopsadmin"
}

variable "db_password" {
  description = "PostgreSQL admin password"
  type        = string
  sensitive   = true
}

# ---- Resource Group ----
resource "azurerm_resource_group" "main" {
  name     = "${var.resource_group_name}-${var.environment}"
  location = var.location

  tags = {
    Environment = var.environment
    Project     = "OrionOps"
    ManagedBy   = "Terraform"
  }
}

# ---- AKS Cluster ----
resource "azurerm_kubernetes_cluster" "main" {
  name                = "${var.cluster_name}-${var.environment}"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  dns_prefix          = "orionops"

  default_node_pool {
    name       = "system"
    node_count = 3
    vm_size    = "Standard_D2s_v5"

    tags = {
      Environment = var.environment
    }
  }

  identity {
    type = "SystemAssigned"
  }

  network_profile {
    network_plugin    = "kubenet"
    load_balancer_sku = "standard"
  }

  tags = {
    Environment = var.environment
    Project     = "OrionOps"
  }
}

# ---- Application Node Pool ----
resource "azurerm_kubernetes_cluster_node_pool" "application" {
  name                  = "apppool"
  kubernetes_cluster_id = azurerm_kubernetes_cluster.main.id
  vm_size               = "Standard_D4s_v5"
  node_count            = 2
  min_count             = 2
  max_count             = 10
  enable_auto_scaling   = true

  tags = {
    Environment = var.environment
    Pool        = "application"
  }
}

# ---- PostgreSQL ----
resource "azurerm_postgresql_flexible_server" "main" {
  name                   = "orionops-psql-${var.environment}"
  resource_group_name    = azurerm_resource_group.main.name
  location               = azurerm_resource_group.main.location
  version                = "16"
  administrator_login    = var.db_username
  administrator_password = var.db_password
  sku_name               = "GP_Standard_D2s_v3"
  storage_mb             = 32768
  backup_retention_days  = 7

  tags = {
    Environment = var.environment
    Project     = "OrionOps"
  }
}

resource "azurerm_postgresql_flexible_server_database" "orionops" {
  name      = "orionops"
  server_id = azurerm_postgresql_flexible_server.main.id
}

# ---- Redis ----
resource "azurerm_redis_cache" "main" {
  name                = "orionops-redis-${var.environment}"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  capacity            = 1
  family              = "P"
  sku_name            = "Premium"
  enable_non_ssl_port = false
  minimum_tls_version = "1.2"

  redis_configuration {
    maxmemory_policy = "allkeys-lru"
  }

  tags = {
    Environment = var.environment
    Project     = "OrionOps"
  }
}

# ---- Container Registry ----
resource "azurerm_container_registry" "main" {
  name                = "orionopsacr${var.environment}"
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  sku                 = "Standard"
  admin_enabled       = true

  tags = {
    Environment = var.environment
    Project     = "OrionOps"
  }
}

# ---- Outputs ----
output "cluster_fqdn" {
  value = azurerm_kubernetes_cluster.main.fqdn
}

output "postgres_fqdn" {
  value = azurerm_postgresql_flexible_server.main.fqdn
}

output "redis_hostname" {
  value = azurerm_redis_cache.main.hostname
}

output "acr_login_server" {
  value = azurerm_container_registry.main.login_server
}
