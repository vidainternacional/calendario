import os

filepath = "app/actions/intercambios.ts"
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace("} as any)", "})")
content = content.replace("payload as any", "payload")

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print("Removed 'as any' from update/insert")
