import styles from './volatalk-profile.module.css';

/* eslint-disable-next-line */
export interface VolatalkProfileProps {}

export function VolatalkProfile(props: VolatalkProfileProps) {
  return (
    <div className={styles['container']}>
      <h1>Welcome to VolatalkProfile!</h1>
    </div>
  );
}

export default VolatalkProfile;
