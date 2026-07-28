import re

with open('src/components/Game.tsx', 'r') as f:
    content = f.read()

content = re.sub(r'    </div>\n  \);\n}', r'    </div>\n    </>\n  );\n}', content)

with open('src/components/Game.tsx', 'w') as f:
    f.write(content)
