# Contributing to WALEMCP

Thank you for your interest in contributing to WALEMCP! This document provides guidelines and instructions for contributing to this project.

## Code of Conduct

Please read and follow our [Code of Conduct](CODE_OF_CONDUCT.md) to ensure a positive and inclusive environment for all contributors.

## How to Contribute

There are many ways to contribute to WALEMCP:

1. **Reporting Bugs**: If you find a bug, please open an issue using our bug report template.
2. **Suggesting Features**: Have an idea for a new feature? Submit a feature request!
3. **Submitting Code Changes**: Contribute by fixing bugs or implementing new features.
4. **Improving Documentation**: Help us improve documentation to make WALEMCP more accessible.
5. **Sharing Templates**: Create and share MCP templates with the community.

## Development Setup

1. **Fork the Repository**: Start by forking the WALEMCP repository.

2. **Clone Your Fork**:
   ```bash
   git clone https://github.com/your-username/WALEMCP.git
   cd WALEMCP
   ```

3. **Install Dependencies**:
   ```bash
   yarn install
   # or
   npm install
   ```

4. **Set Up Environment Variables**:
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

5. **Run Development Server**:
   ```bash
   yarn dev
   # or
   npm run dev
   ```

## Pull Request Process

1. **Create a Branch**:
   ```bash
   git checkout -b feature/your-feature-name
   # or
   git checkout -b fix/your-bug-fix
   ```

2. **Make Changes**: Implement your changes, following our coding standards.

3. **Run Tests**:
   ```bash
   yarn test
   # or
   npm test
   ```

4. **Commit Changes**:
   ```bash
   git commit -m "Your descriptive commit message"
   ```

5. **Push to Your Fork**:
   ```bash
   git push origin feature/your-feature-name
   ```

6. **Create Pull Request**: Submit a pull request to the main repository.

## Coding Standards

- Follow the existing code style in the repository
- Write clear, readable, and well-documented code
- Include appropriate tests for new features or bug fixes
- Update documentation if necessary

## Testing Guidelines

- Write unit tests for new functionality
- Ensure all tests pass before submitting a pull request
- Include integration tests for complex features

## Working with Solana Contracts

When contributing to Solana smart contracts:

1. Install the Solana CLI and Anchor framework
2. Run local tests using Solana's local validator
3. Test thoroughly before submitting changes

## License

By contributing to WALEMCP, you agree that your contributions will be licensed under the project's [MIT License](LICENSE).

## Questions?

If you have any questions about contributing, please reach out to the maintainers or open a discussion on GitHub.

Thank you for helping make WALEMCP better! 