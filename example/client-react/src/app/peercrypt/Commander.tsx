import React, { useState } from "react";

export type Command = () => Promise<string>;

function CommandExecutor({
  commandList,
}: {
  commandList: Command[];
}): JSX.Element {
  const [counter, setCounter] = useState(0);
  const [resultList, setResultList] = useState<string[]>([]);

  const executeCommand = async () => {
    if (counter >= commandList.length) {
      return; // All commands completed
    }

    const command = commandList[counter];
    const result: string = await command();

    setResultList((prevList) => [...prevList, result]);
    setCounter((prevCounter) => prevCounter + 1);
  };

  return (
    <div>
      <button onClick={executeCommand}>Execute Command</button>
      <p>Counter: {counter}</p>
      <ol>
        {resultList.map((result, index) => (
          <li key={index}>{result}</li>
        ))}
      </ol>
    </div>
  );
}

export default CommandExecutor;
