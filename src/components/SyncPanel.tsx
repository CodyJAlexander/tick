import { useState, useEffect } from "react";
import { commands } from "../lib/tauri";

export function SyncPanel() {
  const [googleOn, setGoogleOn] = useState(false);
  const [outlookOn, setOutlookOn] = useState(false);

  useEffect(() => {
    commands.googleSyncStatus().then(setGoogleOn);
    commands.outlookSyncStatus().then(setOutlookOn);
  }, []);

  return (
    <div className="border border-zinc-800 rounded p-3 flex flex-col gap-3 font-mono">
      <h3 className="text-xs text-zinc-400 uppercase tracking-wider">Calendar Sync</h3>
      <div className="flex items-center justify-between">
        <span className="text-sm text-white">Google Calendar</span>
        {googleOn
          ? <button onClick={() => commands.disconnectGoogle().then(() => setGoogleOn(false))}
              className="text-xs text-red-400 hover:text-red-300">Disconnect</button>
          : <button onClick={() => commands.connectGoogle()}
              className="text-xs text-indigo-400 hover:text-indigo-300">Connect</button>
        }
      </div>
      <div className="flex items-center justify-between">
        <span className="text-sm text-white">Outlook Calendar</span>
        {outlookOn
          ? <button onClick={() => commands.disconnectOutlook().then(() => setOutlookOn(false))}
              className="text-xs text-red-400 hover:text-red-300">Disconnect</button>
          : <button onClick={() => commands.connectOutlook()}
              className="text-xs text-indigo-400 hover:text-indigo-300">Connect</button>
        }
      </div>
      <p className="text-xs text-zinc-600">Connect to push completed entries as calendar events automatically.</p>
    </div>
  );
}
