import os
import re

files_to_update = [
    "app/(app)/calendario/page.tsx",
    "app/(app)/ministerios/[id]/avisos/page.tsx",
    "app/(app)/ministerios/[id]/solicitudes/page.tsx",
    "app/(app)/ministerios/[id]/avisos/nuevo/page.tsx",
    "app/(app)/ministerios/[id]/solicitudes/nueva/page.tsx",
    "app/(app)/ministerios/page.tsx",
    "app/(app)/perfil/page.tsx",
    "components/calendario/CalendarioViews.tsx",
    "components/auth/LogoutButton.tsx",
    "components/ministerios/NuevaSolicitudForm.tsx",
    "components/ministerios/NuevoAvisoForm.tsx"
]

for filepath in files_to_update:
    if not os.path.exists(filepath):
        continue
    
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Fix titles
    content = content.replace("text-white", "text-[#171923]")
    
    # But revert text-white for buttons (indigo-600, etc)
    content = content.replace("bg-indigo-600 text-[#171923]", "bg-indigo-600 text-white")
    content = content.replace("hover:bg-indigo-500 text-[#171923]", "hover:bg-indigo-500 text-white")
    
    # Revert specific known buttons if they got mangled
    if "bg-indigo-600" in content and "text-[#171923]" in content:
        # Regex to catch classNames with bg-indigo-600 and text-[#171923]
        content = re.sub(r'(bg-indigo-600.*?)(text-\[\#171923\])', r'\1text-white', content)
        
    # CalendarioViews fixes
    if "CalendarioViews.tsx" in filepath:
        # Active tabs were bg-slate-800, now should be a light active color
        content = content.replace("bg-slate-800 text-[#171923]", "bg-slate-100 text-[#171923]")
        content = content.replace("bg-slate-800", "bg-slate-50")
        content = content.replace("border-slate-700", "border-slate-200")
        content = content.replace("bg-slate-950/50", "bg-slate-50")
        
    # Profile avatar
    if "perfil/page.tsx" in filepath:
        content = content.replace("bg-indigo-600 flex items-center justify-center text-2xl font-bold text-[#171923]", "bg-indigo-600 flex items-center justify-center text-2xl font-bold text-white")
        
    # Forms cancel button
    content = content.replace("bg-slate-800 hover:bg-slate-700 px-4 py-3 text-sm font-semibold text-[#171923]", "bg-slate-200 hover:bg-slate-300 px-4 py-3 text-sm font-semibold text-[#171923]")
    
    # Logout button
    content = content.replace("hover:bg-slate-800", "hover:bg-slate-100")
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

print("Titles and components fixed.")
