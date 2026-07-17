import os
import re

files_to_update = [
    "app/layout.tsx",
    "app/(auth)/login/page.tsx",
    "app/(auth)/signup/page.tsx",
    "app/(app)/inicio/page.tsx",
    "app/(app)/ministerios/page.tsx",
    "app/(app)/ministerios/[id]/layout.tsx",
    "app/(app)/ministerios/[id]/avisos/page.tsx",
    "app/(app)/ministerios/[id]/avisos/nuevo/page.tsx",
    "app/(app)/ministerios/[id]/solicitudes/page.tsx",
    "app/(app)/ministerios/[id]/solicitudes/nueva/page.tsx",
    "app/(app)/calendario/page.tsx",
    "components/calendario/CalendarioViews.tsx",
    "app/(app)/perfil/page.tsx",
    "components/layout/BottomNav.tsx"
]

replacements = {
    r"bg-slate-950": "bg-[#f4f5f9]",
    r"bg-slate-900(\/[0-9]+)?": "bg-white",
    r"text-slate-[123]00": "text-[#171923]",
    r"text-slate-[456]00": "text-gray-500",
    r"border-slate-[78]00": "border-slate-100",
    r"rounded-xl|rounded-2xl": "rounded-[18px]",
    r"shadow-sm": "shadow-[0_4px_18px_rgba(20,24,40,0.08)]"
}

for filepath in files_to_update:
    if not os.path.exists(filepath):
        continue
    
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Custom tweaks for specific files
    if filepath.endswith("BottomNav.tsx"):
        content = content.replace("bg-slate-950/80 backdrop-blur-lg border-t border-slate-800", "bg-white shadow-[0_-4px_18px_rgba(20,24,40,0.08)]")
        content = content.replace("text-slate-500 hover:text-slate-300", "text-gray-500 hover:text-[#171923]")
        
    if filepath == "app/(auth)/login/page.tsx" or filepath == "app/(auth)/signup/page.tsx":
        content = content.replace("text-white", "text-[#171923]")
    
    # Generic replacements
    for pattern, replacement in replacements.items():
        content = re.sub(pattern, replacement, content)
        
    # More custom tweaks post-replacement
    if "ministerios/[id]/layout.tsx" in filepath:
        # Fix header gradient text being changed to dark
        content = content.replace('text-[#171923]', 'text-white') # Revert text-white for header
        content = content.replace('text-gray-500', 'text-white/80') # Revert secondary text in header
        content = re.sub(r'bg-\[\#f4f5f9\] p-4 flex', 'bg-transparent p-4 flex', content)

    if filepath == "app/(app)/inicio/page.tsx":
        content = content.replace("text-white", "text-[#171923]")
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

print("Styles updated.")
