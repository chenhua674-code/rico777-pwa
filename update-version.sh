#!/bin/bash
# 自动更新页面版本号为当前 git commit hash
HASH=$(git rev-parse --short HEAD)
sed -i '' "s/<span class=\"version-tag\">[a-f0-9]*<\/span>/<span class=\"version-tag\">$HASH<\/span>/" index.html
echo "Version updated to $HASH"
