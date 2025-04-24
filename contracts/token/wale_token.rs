use anchor_lang::prelude::*;
use anchor_spl::token;
use anchor_spl::token::{Token, TokenAccount, Mint};

declare_id!("WALEToken111111111111111111111111111111111");

#[program]
pub mod wale_token {
    use super::*;

    /// Initialize the WALE token
    pub fn initialize_token(
        ctx: Context<InitializeToken>,
        name: String,
        symbol: String,
        uri: String,
        decimals: u8,
    ) -> Result<()> {
        let token_info = &mut ctx.accounts.token_info;
        
        // Initialize token metadata
        token_info.name = name;
        token_info.symbol = symbol;
        token_info.uri = uri;
        token_info.decimals = decimals;
        token_info.authority = ctx.accounts.authority.key();
        token_info.mint = ctx.accounts.mint.key();
        token_info.created_at = Clock::get()?.unix_timestamp;
        token_info.total_supply = 0;
        token_info.circulating_supply = 0;
        token_info.is_frozen = false;
        
        emit!(TokenInitializedEvent {
            mint: token_info.mint,
            authority: token_info.authority,
            name: token_info.name.clone(),
            symbol: token_info.symbol.clone(),
            decimals: token_info.decimals,
        });
        
        Ok(())
    }
    
    /// Mint new tokens
    pub fn mint_tokens(
        ctx: Context<MintTokens>,
        amount: u64,
    ) -> Result<()> {
        let token_info = &mut ctx.accounts.token_info;
        
        // Verify authority
        require!(
            ctx.accounts.authority.key() == token_info.authority,
            ErrorCode::UnauthorizedMint
        );
        
        // Verify token not frozen
        require!(!token_info.is_frozen, ErrorCode::TokenFrozen);
        
        // Mint tokens using SPL token program
        let cpi_accounts = token::MintTo {
            mint: ctx.accounts.mint.to_account_info(),
            to: ctx.accounts.destination.to_account_info(),
            authority: ctx.accounts.authority.to_account_info(),
        };
        
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
        
        token::mint_to(cpi_ctx, amount)?;
        
        // Update token info
        token_info.total_supply = token_info.total_supply.checked_add(amount)
            .ok_or(ErrorCode::NumericOverflow)?;
        token_info.circulating_supply = token_info.circulating_supply.checked_add(amount)
            .ok_or(ErrorCode::NumericOverflow)?;
        
        emit!(TokensMintedEvent {
            mint: token_info.mint,
            destination: ctx.accounts.destination.key(),
            amount,
            total_supply: token_info.total_supply,
        });
        
        Ok(())
    }
    
    /// Burn tokens
    pub fn burn_tokens(
        ctx: Context<BurnTokens>,
        amount: u64,
    ) -> Result<()> {
        let token_info = &mut ctx.accounts.token_info;
        
        // Burn tokens using SPL token program
        let cpi_accounts = token::Burn {
            mint: ctx.accounts.mint.to_account_info(),
            from: ctx.accounts.source.to_account_info(),
            authority: ctx.accounts.owner.to_account_info(),
        };
        
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
        
        token::burn(cpi_ctx, amount)?;
        
        // Update token info
        token_info.circulating_supply = token_info.circulating_supply.checked_sub(amount)
            .ok_or(ErrorCode::NumericOverflow)?;
        
        emit!(TokensBurnedEvent {
            mint: token_info.mint,
            source: ctx.accounts.source.key(),
            amount,
            circulating_supply: token_info.circulating_supply,
        });
        
        Ok(())
    }
    
    /// Freeze/unfreeze all token operations
    pub fn set_freeze_state(
        ctx: Context<SetFreezeState>,
        is_frozen: bool,
    ) -> Result<()> {
        let token_info = &mut ctx.accounts.token_info;
        
        // Verify authority
        require!(
            ctx.accounts.authority.key() == token_info.authority,
            ErrorCode::UnauthorizedOperation
        );
        
        // Set freeze state
        token_info.is_frozen = is_frozen;
        
        emit!(TokenFreezeStateChangedEvent {
            mint: token_info.mint,
            is_frozen,
        });
        
        Ok(())
    }
    
    /// Transfer authority to a new account
    pub fn transfer_authority(
        ctx: Context<TransferAuthority>,
        new_authority: Pubkey,
    ) -> Result<()> {
        let token_info = &mut ctx.accounts.token_info;
        
        // Verify current authority
        require!(
            ctx.accounts.authority.key() == token_info.authority,
            ErrorCode::UnauthorizedOperation
        );
        
        // Store old authority for event
        let old_authority = token_info.authority;
        
        // Update authority
        token_info.authority = new_authority;
        
        emit!(AuthorityTransferredEvent {
            mint: token_info.mint,
            old_authority,
            new_authority,
        });
        
        Ok(())
    }
}

#[derive(Accounts)]
pub struct InitializeToken<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    
    #[account(
        init,
        payer = authority,
        space = TokenInfo::space(),
        seeds = [b"token_info", mint.key().as_ref()],
        bump
    )]
    pub token_info: Account<'info, TokenInfo>,
    
    pub mint: Account<'info, Mint>,
    
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct MintTokens<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    
    #[account(
        mut,
        seeds = [b"token_info", mint.key().as_ref()],
        bump
    )]
    pub token_info: Account<'info, TokenInfo>,
    
    #[account(mut)]
    pub mint: Account<'info, Mint>,
    
    #[account(mut)]
    pub destination: Account<'info, TokenAccount>,
    
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct BurnTokens<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,
    
    #[account(
        mut,
        seeds = [b"token_info", mint.key().as_ref()],
        bump
    )]
    pub token_info: Account<'info, TokenInfo>,
    
    #[account(mut)]
    pub mint: Account<'info, Mint>,
    
    #[account(
        mut,
        constraint = source.owner == owner.key(),
    )]
    pub source: Account<'info, TokenAccount>,
    
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct SetFreezeState<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    
    #[account(
        mut,
        seeds = [b"token_info", mint.key().as_ref()],
        bump
    )]
    pub token_info: Account<'info, TokenInfo>,
    
    pub mint: Account<'info, Mint>,
}

#[derive(Accounts)]
pub struct TransferAuthority<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    
    #[account(
        mut,
        seeds = [b"token_info", mint.key().as_ref()],
        bump
    )]
    pub token_info: Account<'info, TokenInfo>,
    
    pub mint: Account<'info, Mint>,
}

#[account]
pub struct TokenInfo {
    pub name: String,           // Token name
    pub symbol: String,         // Token symbol
    pub uri: String,            // Metadata URI
    pub decimals: u8,           // Decimal precision
    pub authority: Pubkey,      // Authority that can mint/freeze
    pub mint: Pubkey,           // Mint address
    pub created_at: i64,        // Creation timestamp
    pub total_supply: u64,      // Total tokens ever minted
    pub circulating_supply: u64, // Current supply (minted - burned)
    pub is_frozen: bool,        // Freeze state
}

impl TokenInfo {
    pub fn space() -> usize {
        // Fixed size fields
        let fixed_size = 8 + // Discriminator
            1 + // Decimals
            32 + // Authority pubkey
            32 + // Mint pubkey
            8 + // Created timestamp
            8 + // Total supply
            8 + // Circulating supply
            1; // Is frozen
        
        // Variable size fields with maximum lengths
        let variable_size = 4 + 50 +  // name (String with max 50 chars)
            4 + 10 +                  // symbol (String with max 10 chars)
            4 + 200;                  // uri (String with max 200 chars)
            
        fixed_size + variable_size
    }
}

#[error_code]
pub enum ErrorCode {
    #[msg("Unauthorized mint operation")]
    UnauthorizedMint,
    #[msg("Unauthorized operation")]
    UnauthorizedOperation,
    #[msg("Token operations are frozen")]
    TokenFrozen,
    #[msg("Numeric overflow occurred")]
    NumericOverflow,
}

// Events
#[event]
pub struct TokenInitializedEvent {
    pub mint: Pubkey,
    pub authority: Pubkey,
    pub name: String,
    pub symbol: String,
    pub decimals: u8,
}

#[event]
pub struct TokensMintedEvent {
    pub mint: Pubkey,
    pub destination: Pubkey,
    pub amount: u64,
    pub total_supply: u64,
}

#[event]
pub struct TokensBurnedEvent {
    pub mint: Pubkey,
    pub source: Pubkey,
    pub amount: u64,
    pub circulating_supply: u64,
}

#[event]
pub struct TokenFreezeStateChangedEvent {
    pub mint: Pubkey,
    pub is_frozen: bool,
}

#[event]
pub struct AuthorityTransferredEvent {
    pub mint: Pubkey,
    pub old_authority: Pubkey,
    pub new_authority: Pubkey,
} 