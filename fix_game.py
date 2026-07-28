import re

with open('src/components/Game.tsx', 'r') as f:
    content = f.read()

# Replace if (isCompact) { return ( ... ) }
pattern = r"  if \(isCompact\) \{\n    return \(\n      <div className=\"w-full flex items-center justify-between gap-4\">\n        \{settings\.backgroundSound \!== \"none\" && \(\n          <audio[\s\S]*?className=\"hidden\"\n          />\n        \)\}([\s\S]*?)      </div>\n    \);\n  \}"

# Remove the audio from the compact return
replacement = r"""  if (isCompact) {
    return (
      <>
        {settings.backgroundSound !== "none" && (
          <audio
            ref={audioRef}
            src={BACKGROUND_SOUNDS[settings.backgroundSound]}
            loop
            className="hidden"
          />
        )}
        <div className="w-full flex items-center justify-between gap-4">
\1      </div>
      </>
    );
  }"""

content = re.sub(pattern, replacement, content)

# Remove the audio from the normal return
pattern2 = r"  return \(\n    <div className=\"w-full min-w-0 min-h-screen overflow-y-auto bg-slate-50 dark:bg-slate-800/50 p-2 sm:p-4 flex items-center justify-center\">\n      \{settings\.backgroundSound \!== \"none\" && \(\n        <audio[\s\S]*?className=\"hidden\"\n        />\n      \)\}"

replacement2 = r"""  return (
    <>
      {settings.backgroundSound !== "none" && (
        <audio
          ref={audioRef}
          src={BACKGROUND_SOUNDS[settings.backgroundSound]}
          loop
          className="hidden"
        />
      )}
      <div className="w-full min-w-0 min-h-screen overflow-y-auto bg-slate-50 dark:bg-slate-800/50 p-2 sm:p-4 flex items-center justify-center">"""

content = re.sub(pattern2, replacement2, content)

with open('src/components/Game.tsx', 'w') as f:
    f.write(content)
