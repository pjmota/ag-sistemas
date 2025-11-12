import React from 'react';
import styles from './css/button.module.css';

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  loading?: boolean;
};

export function Button({ loading, children, ...rest }: ButtonProps) {
  return (
    <button
      {...rest}
      className={`${styles.button} ${rest.className || ''}`}
      disabled={loading || rest.disabled}
    >
      {loading ? 'Enviando...' : children}
    </button>
  );
}

export default Button;