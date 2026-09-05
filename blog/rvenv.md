# rvenv

/ˌɑːrviːiːɛnˈviː/

rvenv is a lightweight shell-based framework I built to manage project-specific identities and secure environment variables without cluttering up your global configuration. It lets you "step into" a workspace where the `PATH`, `PS1`, and encrypted secrets are automatically scoped to that specific project.

## Key Features

- **Encrypted Vault**: Store sensitive environment variables securely with AES-256 or ChaCha20 encryption.
- **Master Password Storage**: Optionally store your vault password locally (`~/.config/rvenv/.vault_pass`) for seamless session entry.
- **Interactive Setup**: Simple installation process to configure your identity and security preferences.
- **Identity Management**: Project-specific user identities (Name/Handle) scoped to your workspace.
- **Environment Isolation**: Automatic PATH and PS1 scoping when entering a project.
- **Identifier Validation**: Ensures all secret keys are valid Bash identifiers to prevent shell errors.
- **Modular Architecture**: Clean separation of concerns with router, engine, and vault components.

## Quick Start

### For Bash

```bash
git clone https://github.com/rvenv/rvenv.git
cd rvenv
make install
```

### For PowerShell

```powershell
git clone https://github.com/rvenv/rvenv.git
cd rvenv
./install.ps1
```

## Common Usage

### Initialize a Project

```bash
rvenv init
```

### Store Secrets

```bash
rvenv put API_KEY "your-secret-token"
```

### Enter Environment

```bash
# Bash
rvenv enter
```

## Commands Reference

| Command                            | Description                                      |
| :--------------------------------- | :----------------------------------------------- |
| `rvenv user --name NAME`           | Set your display name                            |
| `rvenv user --username HANDLE`     | Set your username/handle                         |
| `rvenv config --encryption METHOD` | Choose encryption backend                        |
| `rvenv status`                     | Show current identity and session info           |
| `rvenv init`                       | Initialize vault in current directory            |
| `rvenv put KEY VALUE`              | Store encrypted secret                           |
| `rvenv list`                       | List vault keys                                  |
| `rvenv enter`                      | Start environment session with decrypted secrets |
| `rvenv uptime`                     | Show current session duration                    |
| `rvenv --version`                  | Show version information                         |
