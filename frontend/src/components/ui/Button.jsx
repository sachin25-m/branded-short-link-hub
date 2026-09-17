export const Button = ({
  children,
  type = 'button',
  variant = 'primary',
  loading = false,
  disabled = false,
  onClick,
  ...props
}) => {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      className={`coss-button ${variant === 'secondary' ? 'secondary' : ''}`}
      {...props}
    >
      {loading ? <span className="coss-spinner" /> : children}
    </button>
  );
};
