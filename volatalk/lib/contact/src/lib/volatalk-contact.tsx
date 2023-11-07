import styles from './volatalk-contact.module.css';

/* eslint-disable-next-line */
export interface VolatalkContactProps {}

export function VolatalkContact(props: VolatalkContactProps) {
  return (
    <div className={styles['container']}>
      <h1>Welcome to VolatalkContact!</h1>
    </div>
  );
}

export default VolatalkContact;
