param(
    [Parameter(ValueFromRemainingArguments = $true)]
    [string[]]$Args
)

$gitDir = 'C:/Users/Nosta/AtenaAI_clean_clone/.git'
$workTree = 'C:/Users/Nosta/OneDrive/Projetos/AtenaAI'

if (-not (Test-Path $gitDir)) {
    Write-Error "Git database not found at $gitDir"
    exit 1
}

& git --git-dir=$gitDir --work-tree=$workTree @Args
exit $LASTEXITCODE
