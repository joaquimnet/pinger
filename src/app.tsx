import { useCallback, useEffect, useState } from 'preact/hooks';
import './app.css';

interface Target {
  name: string;
  url: string;
  lastStatusCode: number;
  frequency: number;
}

const pingers = new Map<string, number>();

function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.log(error);
      return initialValue;
    }
  });

  const setValue = useCallback(
    (value: T) => {
      try {
        setStoredValue(value);
        window.localStorage.setItem(key, JSON.stringify(value));
      } catch (error) {
        console.log(error);
      }
    },
    [key]
  );

  return [storedValue, setValue] as const;
}

export function App() {
  const [savedTargets, setSavedTargets] = useLocalStorage<Target[]>('targets', []);
  const [targets, setTargets] = useState<Target[]>([]);
  const [targetName, setTargetName] = useState('');
  const [targetUrl, setTargetUrl] = useState('');
  const [targetFrequency, setTargetFrequency] = useState(60);

  useEffect(() => {
    setTargets(savedTargets);
  }, []);

  useEffect(() => {
    setSavedTargets(targets);
  }, [targets]);

  const addPinger = useCallback((target: Target) => {
    const pingIt = async () => {
      const response = await fetch(target.url);
      if (response.status !== target.lastStatusCode) {
        setTargets((targets) => {
          return targets.map((t) => {
            if (t.name === target.name) {
              return { ...t, lastStatusCode: response.status };
            } else {
              return t;
            }
          });
        });
      }
    };
    pingIt();
    const interval = setInterval(pingIt, target.frequency * 1000);
    pingers.set(target.url, interval);
  }, []);

  const removeTargetAndPinger = useCallback((target: Target) => {
    const interval = pingers.get(target.url);
    if (interval) {
      clearInterval(interval);
      pingers.delete(target.url);
    }
    setTargets((targets) => {
      return targets.filter((t) => t.url !== target.url);
    });
  }, []);

  const onChange = useCallback((e: Event) => {
    const target = e.target as HTMLInputElement;
    if (target.name === 'name') {
      setTargetName(target.value);
    } else if (target.name === 'url') {
      setTargetUrl(target.value);
    } else if (target.name === 'frequency') {
      setTargetFrequency(parseInt(target.value));
    }
  }, []);

  const onSubmit = useCallback(
    (e) => {
      e.preventDefault();
      const newTarget = {
        name: targetName,
        url: targetUrl,
        lastStatusCode: 0,
        frequency: targetFrequency,
      };
      setTargets((targets) => [...targets, newTarget]);
      addPinger(newTarget);
      setTargetName('');
      setTargetUrl('');
    },
    [targetName, targetUrl],
  );

  return (
    <>
      <h1>Pinger</h1>
      <div class='card card-border'>
        <h2>Add target</h2>
        <form class='form' onSubmit={onSubmit}>
          <div class='form-control'>
            <input id='name-field' type='text' name='name' value={targetName} onChange={onChange} />
            <input type='text' name='url' value={targetUrl} onChange={onChange} />
            <input type='number' name='frequency' value={targetFrequency} onChange={onChange} />
            <button type='submit'>Add</button>
          </div>
        </form>
        <div class='card'>
          <h2>Targets</h2>
          <table class='table'>
            <tbody>
              {targets.map((target) => (
                <tr class='row'>
                  <td class='cell'>{target.name}</td>
                  <td class='cell'>{target.url}</td>
                  <td class='cell'>{target.frequency}s</td>
                  <td class='cell' style={{ color: getStatusCodeColor(target.lastStatusCode) }}>
                    {target.lastStatusCode}
                  </td>
                  <td class='cell'>
                    <button class='remove-button' onClick={() => removeTargetAndPinger(target)}>
                      ❌
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {
          <pre>
            <code>{JSON.stringify(targets, null, 2)}</code>
          </pre>
        }
        {
          <pre>
            <code>{JSON.stringify({ targetName, targetUrl, targetFrequency })}</code>
          </pre>
        }
      </div>
      <p class='read-the-docs'>Click on the Vite and Preact logos to learn more</p>
    </>
  );
}

function getStatusCodeColor(code: number): 'green' | 'yellow' | 'red' {
  if (code >= 200 && code < 300) {
    return 'green';
  } else if (code >= 300 && code < 400) {
    return 'yellow';
  } else {
    return 'red';
  }
}
