# ------------------------------
# 📦 Homebrew
# ------------------------------
# Cache prefix to avoid repeated slow subprocess calls
BREW_PREFIX=$(brew --prefix)

# ------------------------------
# 🧠 Completion
# ------------------------------
# Set completion cache file location
export ZSH_COMPDUMP="$HOME/.zcompdump"
# Load and initialize completion system
autoload -Uz compinit
compinit -d "$ZSH_COMPDUMP"

# ------------------------------
# 📜 History
# ------------------------------
# Number of commands kept in memory and on disk
HISTSIZE=10000
SAVEHIST=10000
HISTFILE="$HOME/.zsh_history"
# Sync history across all active sessions
setopt SHARE_HISTORY
# Skip duplicate consecutive commands
setopt HIST_IGNORE_DUPS
# Skip commands prefixed with a space (useful for sensitive input)
setopt HIST_IGNORE_SPACE

# ------------------------------
# ⚙️ Shell Options
# ------------------------------
# Navigate into directories without typing cd
setopt AUTO_CD
# Suggest corrections for mistyped commands
setopt CORRECT

# ------------------------------
# 🛣️ PATH
# ------------------------------
# Prevent duplicate entries in PATH
typeset -U PATH
# Prepend user local bin for highest priority
export PATH="$HOME/.local/bin:$PATH"

export rime_frontend='rime/squirrel'

# ------------------------------
# 🤖 Kimi Code (Claude Code)
# ------------------------------
export ENABLE_TOOL_SEARCH=false
export ANTHROPIC_BASE_URL=https://api.kimi.com/coding/
export ANTHROPIC_API_KEY=xxx

# 复制并显示路径
copy_current_path() {
    if [[ "$OSTYPE" == "darwin"* ]]; then
        pwd | pbcopy
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        pwd | xclip -selection clipboard
    elif [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "cygwin" ]]; then
        pwd | clip
    else
        echo "不支持的操作系统"
        return 1
    fi
    echo "✓ copied: $(pwd)"
}

# 设置别名 cpath
alias cwd='copy_current_path'

# ------------------------------
# 🔧 Aliases
# ------------------------------
# Force English output for easier searching and debugging
alias git='LANG=en_US.UTF-8 git'

# eza — modern replacement for ls
alias ls='eza --icons'
alias ll='eza --icons -lh'           # long list with human-readable sizes
alias la='eza --icons -lha'          # long list including hidden files
alias lt='eza --icons --tree -L 2'   # tree view, 2 levels deep
alias lg='eza --icons -lh --git'     # long list with git status

# bat — modern replacement for cat with syntax highlighting
alias cat='bat --paging=never'

# fd — modern replacement for find, faster and respects .gitignore
alias find='fd'

# ------------------------------
# 🛠️ Functions
# ------------------------------
# Create a directory and immediately cd into it
mkcd() { mkdir -p "$1" && cd "$1" }

# Tree view with optional depth argument (default: 2)
tree() { eza --icons --tree -L "${1:-2}" }

# ------------------------------
# 🟢 fnm — Node version manager
# ------------------------------
# Auto-switch Node version on directory change
eval "$(fnm env --use-on-cd --shell zsh --log-level=quiet)"

# ------------------------------
# 📂 zoxide — smart cd replacement
# ------------------------------
# Learns your most-visited directories, jump with: z <keyword>
eval "$(zoxide init zsh)"

# ------------------------------
# 🔍 fzf — fuzzy finder
# ------------------------------
# Ctrl+R: fuzzy search history
# Ctrl+T: fuzzy search files and insert path
# Alt+C:  fuzzy search directories and jump into them
[ -f "$HOME/.fzf.zsh" ] && source "$HOME/.fzf.zsh"

# Use fd as the default source for fzf (faster, respects .gitignore)
export FZF_DEFAULT_COMMAND='fd --type f --hidden --follow --exclude .git'
export FZF_CTRL_T_COMMAND="$FZF_DEFAULT_COMMAND"
export FZF_ALT_C_COMMAND='fd --type d --hidden --follow --exclude .git'

# Preview file contents with bat when using Ctrl+T
export FZF_CTRL_T_OPTS="--preview 'bat --color=always --line-range :50 {}'"

# ------------------------------
# ⭐ Starship — shell prompt
# ------------------------------
# Shows git branch, node version, command duration, and more
eval "$(starship init zsh)"

# ------------------------------
# ⚡ Plugins
# ------------------------------
# Show suggestions based on history (accept with →)
source "$BREW_PREFIX/share/zsh-autosuggestions/zsh-autosuggestions.zsh"

# Highlight valid commands in green, invalid in red
# Must be sourced last to work correctly
source "$BREW_PREFIX/share/zsh-syntax-highlighting/zsh-syntax-highlighting.zsh"

