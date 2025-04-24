use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token};
use std::mem::size_of;

declare_id!("MCPv1111111111111111111111111111111111111");

#[program]
pub mod mcp {
    use super::*;

    /// Initialize a new template account
    pub fn initialize_template(
        ctx: Context<InitializeTemplate>,
        template_id: String,
        template_name: String,
        template_version: String,
        category: String,
        creator: Pubkey,
        metadata: Vec<u8>,
    ) -> Result<()> {
        let template = &mut ctx.accounts.template;
        
        // Validate inputs
        require!(template_id.len() <= 64, ErrorCode::TemplateTooLong);
        require!(template_name.len() <= 100, ErrorCode::NameTooLong);
        require!(template_version.len() <= 20, ErrorCode::VersionTooLong);
        require!(category.len() <= 20, ErrorCode::CategoryTooLong);
        require!(metadata.len() <= 1024, ErrorCode::MetadataTooLarge);
        
        // Initialize template data
        template.template_id = template_id;
        template.template_name = template_name;
        template.template_version = template_version;
        template.category = category;
        template.creator = creator;
        template.metadata = metadata;
        template.created_at = Clock::get()?.unix_timestamp;
        template.updated_at = Clock::get()?.unix_timestamp;
        template.usage_count = 0;
        template.is_active = true;
        template.bumps.template = *ctx.bumps.get("template").unwrap();
        
        emit!(TemplateCreatedEvent {
            template_id: template.template_id.clone(),
            creator: template.creator,
            timestamp: template.created_at,
        });
        
        Ok(())
    }
    
    /// Record a template execution
    pub fn record_execution(
        ctx: Context<RecordExecution>,
        task_id: String,
        inputs_hash: String,
        outputs_hash: String,
        status: ExecutionStatus,
    ) -> Result<()> {
        let execution = &mut ctx.accounts.execution;
        let template = &mut ctx.accounts.template;
        
        // Validate inputs
        require!(task_id.len() <= 64, ErrorCode::TaskIdTooLong);
        require!(inputs_hash.len() <= 64, ErrorCode::HashTooLong);
        require!(outputs_hash.len() <= 64, ErrorCode::HashTooLong);
        
        // Initialize execution data
        execution.task_id = task_id;
        execution.template = template.key();
        execution.user = ctx.accounts.user.key();
        execution.inputs_hash = inputs_hash;
        execution.outputs_hash = outputs_hash;
        execution.status = status;
        execution.started_at = Clock::get()?.unix_timestamp;
        execution.completed_at = if status == ExecutionStatus::Success || status == ExecutionStatus::Failure {
            Clock::get()?.unix_timestamp
        } else {
            0
        };
        execution.bumps.execution = *ctx.bumps.get("execution").unwrap();
        
        // Update template usage count
        template.usage_count += 1;
        template.updated_at = Clock::get()?.unix_timestamp;
        
        emit!(ExecutionRecordedEvent {
            task_id: execution.task_id.clone(),
            template_id: template.template_id.clone(),
            user: execution.user,
            status: execution.status,
            timestamp: execution.started_at,
        });
        
        Ok(())
    }
    
    /// Update execution status
    pub fn update_execution(
        ctx: Context<UpdateExecution>,
        status: ExecutionStatus,
        outputs_hash: Option<String>,
    ) -> Result<()> {
        let execution = &mut ctx.accounts.execution;
        
        // Validate the update
        require!(
            execution.status == ExecutionStatus::InProgress,
            ErrorCode::InvalidExecutionStatus
        );
        
        // Update execution data
        execution.status = status;
        if let Some(new_outputs_hash) = outputs_hash {
            require!(new_outputs_hash.len() <= 64, ErrorCode::HashTooLong);
            execution.outputs_hash = new_outputs_hash;
        }
        
        if status == ExecutionStatus::Success || status == ExecutionStatus::Failure {
            execution.completed_at = Clock::get()?.unix_timestamp;
        }
        
        emit!(ExecutionUpdatedEvent {
            task_id: execution.task_id.clone(),
            status: execution.status,
            timestamp: Clock::get()?.unix_timestamp,
        });
        
        Ok(())
    }
    
    /// Update template metadata
    pub fn update_template(
        ctx: Context<UpdateTemplate>,
        template_name: Option<String>,
        template_version: Option<String>,
        metadata: Option<Vec<u8>>,
        is_active: Option<bool>,
    ) -> Result<()> {
        let template = &mut ctx.accounts.template;
        
        // Validate inputs
        if let Some(ref name) = template_name {
            require!(name.len() <= 100, ErrorCode::NameTooLong);
            template.template_name = name.clone();
        }
        
        if let Some(ref version) = template_version {
            require!(version.len() <= 20, ErrorCode::VersionTooLong);
            template.template_version = version.clone();
        }
        
        if let Some(ref new_metadata) = metadata {
            require!(new_metadata.len() <= 1024, ErrorCode::MetadataTooLarge);
            template.metadata = new_metadata.clone();
        }
        
        if let Some(active) = is_active {
            template.is_active = active;
        }
        
        template.updated_at = Clock::get()?.unix_timestamp;
        
        emit!(TemplateUpdatedEvent {
            template_id: template.template_id.clone(),
            updater: ctx.accounts.creator.key(),
            timestamp: template.updated_at,
        });
        
        Ok(())
    }
}

#[derive(Accounts)]
#[instruction(template_id: String)]
pub struct InitializeTemplate<'info> {
    #[account(mut)]
    pub creator: Signer<'info>,
    
    #[account(
        init,
        payer = creator,
        space = TemplateAccount::space(&template_id),
        seeds = [
            b"template",
            template_id.as_bytes(),
            creator.key().as_ref(),
        ],
        bump
    )]
    pub template: Account<'info, TemplateAccount>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(task_id: String)]
pub struct RecordExecution<'info> {
    #[account(mut)]
    pub user: Signer<'info>,
    
    #[account(mut)]
    pub template: Account<'info, TemplateAccount>,
    
    #[account(
        init,
        payer = user,
        space = ExecutionAccount::space(&task_id),
        seeds = [
            b"execution",
            task_id.as_bytes(),
            user.key().as_ref(),
        ],
        bump
    )]
    pub execution: Account<'info, ExecutionAccount>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct UpdateExecution<'info> {
    #[account(mut)]
    pub user: Signer<'info>,
    
    #[account(
        mut,
        constraint = execution.user == user.key(),
    )]
    pub execution: Account<'info, ExecutionAccount>,
}

#[derive(Accounts)]
pub struct UpdateTemplate<'info> {
    #[account(mut)]
    pub creator: Signer<'info>,
    
    #[account(
        mut,
        constraint = template.creator == creator.key(),
    )]
    pub template: Account<'info, TemplateAccount>,
}

#[account]
#[derive(Default)]
pub struct TemplateAccount {
    pub template_id: String,          // Unique identifier
    pub template_name: String,        // Display name
    pub template_version: String,     // Version string
    pub category: String,             // Category (defi, dao, analytics, etc.)
    pub creator: Pubkey,              // Creator's public key
    pub metadata: Vec<u8>,            // IPFS/Arweave CID or compressed metadata
    pub created_at: i64,              // Creation timestamp
    pub updated_at: i64,              // Last update timestamp
    pub usage_count: u64,             // Number of executions
    pub is_active: bool,              // Active status
    pub bumps: TemplateBumps,         // PDA bumps
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Default)]
pub struct TemplateBumps {
    pub template: u8,
}

#[account]
#[derive(Default)]
pub struct ExecutionAccount {
    pub task_id: String,              // Unique task identifier
    pub template: Pubkey,             // Template PDA account
    pub user: Pubkey,                 // User who executed the task
    pub inputs_hash: String,          // Hash of input data (for verification)
    pub outputs_hash: String,         // Hash of output data (for verification)
    pub status: ExecutionStatus,      // Execution status
    pub started_at: i64,              // Start timestamp
    pub completed_at: i64,            // Completion timestamp
    pub bumps: ExecutionBumps,        // PDA bumps
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Default)]
pub struct ExecutionBumps {
    pub execution: u8,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq)]
pub enum ExecutionStatus {
    InProgress,
    Success,
    Failure,
}

impl Default for ExecutionStatus {
    fn default() -> Self {
        ExecutionStatus::InProgress
    }
}

impl TemplateAccount {
    pub fn space(template_id: &str) -> usize {
        // Fixed size fields
        let fixed_size = 8 + // Discriminator
            32 + // Pubkey
            8 + // Created timestamp
            8 + // Updated timestamp
            8 + // Usage count
            1 + // Is active
            1 + // Bump
            4; // Vec header for metadata
        
        // Variable size fields
        let variable_size = 4 + template_id.len() +      // template_id (String)
            4 + 100 +                                    // template_name (allocate max)
            4 + 20 +                                     // template_version (allocate max)
            4 + 20 +                                     // category (allocate max)
            1024;                                        // metadata (allocate max)
            
        fixed_size + variable_size
    }
}

impl ExecutionAccount {
    pub fn space(task_id: &str) -> usize {
        // Fixed size fields
        let fixed_size = 8 + // Discriminator
            32 + // Template PDA
            32 + // User pubkey
            4 + // Status (enum)
            8 + // Started timestamp
            8 + // Completed timestamp
            1; // Bump
        
        // Variable size fields
        let variable_size = 4 + task_id.len() +  // task_id (String)
            4 + 64 +                            // inputs_hash (allocate max)
            4 + 64;                             // outputs_hash (allocate max)
            
        fixed_size + variable_size
    }
}

#[error_code]
pub enum ErrorCode {
    #[msg("Template ID too long")]
    TemplateTooLong,
    #[msg("Template name too long")]
    NameTooLong,
    #[msg("Template version too long")]
    VersionTooLong,
    #[msg("Category too long")]
    CategoryTooLong,
    #[msg("Task ID too long")]
    TaskIdTooLong,
    #[msg("Hash value too long")]
    HashTooLong,
    #[msg("Metadata too large")]
    MetadataTooLarge,
    #[msg("Invalid execution status")]
    InvalidExecutionStatus,
}

// Events
#[event]
pub struct TemplateCreatedEvent {
    pub template_id: String,
    pub creator: Pubkey,
    pub timestamp: i64,
}

#[event]
pub struct TemplateUpdatedEvent {
    pub template_id: String,
    pub updater: Pubkey,
    pub timestamp: i64,
}

#[event]
pub struct ExecutionRecordedEvent {
    pub task_id: String,
    pub template_id: String,
    pub user: Pubkey,
    pub status: ExecutionStatus,
    pub timestamp: i64,
}

#[event]
pub struct ExecutionUpdatedEvent {
    pub task_id: String,
    pub status: ExecutionStatus,
    pub timestamp: i64,
} 