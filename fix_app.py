import re

with open('src/App.tsx', 'r') as f:
    content = f.read()

# Replace the conditional render
pattern = r"  if \(isCompact\) \{[\s\S]*?    \);\n  \}\n\n  return \([\s\S]*?\);\n\}"

replacement = """  return (
    <div className={
      isCompact 
        ? "bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-sans w-full h-screen overflow-hidden flex flex-row items-center justify-between px-2 sm:px-4 gap-4 transition-colors duration-300"
        : "min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-sans selection:bg-indigo-100 dark:selection:bg-indigo-900 overflow-x-hidden w-full transition-colors duration-300"
    }>
      <div className={
        isCompact
          ? "flex items-center gap-2 shrink-0"
          : "fixed top-3 left-3 sm:top-6 sm:left-6 z-50 flex items-center gap-2"
      }>
        <div className="flex gap-2">
          <button 
            onClick={toggleDarkMode}
            className={`p-2 ${!isCompact ? 'sm:p-3' : ''} rounded-full bg-white dark:bg-slate-800 shadow-md border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all flex items-center justify-center`}
            title="Toggle dark mode"
          >
            {isDarkMode ? <Sun className={`w-5 h-5 ${!isCompact ? 'sm:w-6 sm:h-6' : ''}`} /> : <Moon className={`w-5 h-5 ${!isCompact ? 'sm:w-6 sm:h-6' : ''}`} />}
          </button>
          <button 
            onClick={toggleCompact}
            className={`p-2 ${!isCompact ? 'sm:p-3' : ''} rounded-full bg-white dark:bg-slate-800 shadow-md border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all flex items-center justify-center`}
            title={isCompact ? "Modo Completo" : "Modo Compacto"}
          >
            {isCompact ? <Maximize2 className="w-5 h-5" /> : <Minimize2 className={`w-5 h-5 ${!isCompact ? 'sm:w-6 sm:h-6' : ''}`} />}
          </button>
        </div>
      </div>

      {!isCompact && (
        <BedtimeCountdown bedtime={bedtime} workdayEnd={workdayEnd} lunchTime={lunchTime} />
      )}

      <div className={isCompact ? "flex-1 flex items-center min-w-0" : "w-full"}>
        {view === "dashboard" && (
          <Dashboard 
            stats={stats} 
            onStartGame={handleStartGame} 
            bedtime={bedtime}
            onBedtimeChange={handleBedtimeChange}
            workdayEnd={workdayEnd}
            onWorkdayEndChange={handleWorkdayEndChange}
            lunchTime={lunchTime}
            onLunchTimeChange={handleLunchTimeChange}
            motivation={motivation}
            onMotivationChange={handleMotivationChange}
            reminderSettings={reminderSettings}
            onReminderSettingsChange={setReminderSettings}
            isCompact={isCompact}
          />
        )}
        {view === "game" && currentSettings && (
          <Game
            settings={currentSettings}
            onFinish={handleFinishGame}
            onAbandon={handleAbandon}
            motivation={motivation}
            isCompact={isCompact}
          />
        )}
        {view === "summary" && currentSettings && lastResults && (
          <Summary
            settings={currentSettings}
            results={lastResults.results}
            strike={lastResults.strike}
            actualSeconds={lastResults.actualSeconds}
            onHome={() => setView("dashboard")}
            onRestart={() => handleStartGame(currentSettings)}
            isCompact={isCompact}
          />
        )}
      </div>

      {isCompact && (
        <div className="shrink-0 flex items-center hidden sm:flex">
          <BedtimeCountdown bedtime={bedtime} workdayEnd={workdayEnd} lunchTime={lunchTime} isCompact={true} />
        </div>
      )}
    </div>
  );
}"""

new_content = re.sub(pattern, replacement, content)
with open('src/App.tsx', 'w') as f:
    f.write(new_content)
