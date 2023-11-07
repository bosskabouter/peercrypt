// eslint-disable-next-line @typescript-eslint/no-unused-vars
import styles from './app.module.css';

import NxWelcome from './nx-welcome';

import { Route, Routes, Link } from 'react-router-dom';
import Peers from './peercrypt/Peers';
import PushYourself from './peercrypt/Push';

export function App() {
  return (
    <div>
      <NxWelcome title="example-client-react" />

      {/* START: routes */}
      {/* These routes and navigation have been generated for you */}
      {/* Feel free to move and update them to fit your needs */}
      <br />
      <hr />
      <br />
      <div role="navigation">
        <ul>
          <li>
            <Link to="/">Home</Link>
          </li>
          <li>
            <Link to="/pushYourself">Push Yourself!</Link>
          </li>
        </ul>
      </div>
      <Routes>
        <Route
          path="/"
          element={
            <Peers></Peers>
          }
        />
        <Route
          path="/pushYourself"
          element={
            <PushYourself/>
          }
        />
      </Routes>
      {/* END: routes */}
    </div>
  );
}

export default App;
