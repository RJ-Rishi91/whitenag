export function requirePermission(permission) {
  return (req, res, next) => {
    if (!req.user || !req.user.roleId) {
      return res.status(403).json({ success: false, message: 'Access denied: No role assigned' });
    }

    const role = req.user.roleId;

    // Admin has superuser access
    if (role.code === 'ADMIN' || (role.permissions && role.permissions.includes('*'))) {
      return next();
    }

    if (role.permissions && role.permissions.includes(permission)) {
      return next();
    }

    return res.status(403).json({
      success: false,
      message: `Access denied: missing permission '${permission}'`
    });
  };
}

export function requireAdmin(req, res, next) {
  if (!req.user || !req.user.roleId || req.user.roleId.code !== 'ADMIN') {
    return res.status(403).json({ success: false, message: 'Admin access required' });
  }
  next();
}
