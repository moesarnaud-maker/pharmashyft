/**
 * Format a user's display name in "First Last" format
 * Falls back to full_name, then email, then 'Unknown'
 */
export function formatUserName(user) {
    if (!user) return 'Unknown';
    
    if (user.first_name || user.last_name) {
        return `${user.first_name || ''} ${user.last_name || ''}`.trim();
    }
    
    return user.full_name || user.email || 'Unknown';
}

/**
 * Get initials from a user object
 */
export function getUserInitials(user) {
    if (!user) return '?';
    
    if (user.first_name) {
        return user.first_name.charAt(0).toUpperCase();
    }
    
    if (user.full_name) {
        return user.full_name.charAt(0).toUpperCase();
    }
    
    if (user.email) {
        return user.email.charAt(0).toUpperCase();
    }
    
    return '?';
}