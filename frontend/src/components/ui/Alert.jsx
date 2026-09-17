export const Alert = ({ type = 'info', children, className = '' }) => {
  if (!children) return null;

  return (
    <div className={`coss-alert ${type} ${className}`}>
      <div>{children}</div>
    </div>
  );
};
