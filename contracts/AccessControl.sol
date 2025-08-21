// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title AccessControl
 * @dev Role-based access control for supply chain participants
 */
contract AccessControl {
    
    // Role definitions
    bytes32 public constant DEFAULT_ADMIN_ROLE = 0x00;
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant PARTICIPANT_ROLE = keccak256("PARTICIPANT_ROLE");
    bytes32 public constant AUDITOR_ROLE = keccak256("AUDITOR_ROLE");
    bytes32 public constant IOT_DEVICE_ROLE = keccak256("IOT_DEVICE_ROLE");
    bytes32 public constant SHARD_MANAGER_ROLE = keccak256("SHARD_MANAGER_ROLE");
    
    // Events
    event RoleGranted(bytes32 indexed role, address indexed account, address indexed sender);
    event RoleRevoked(bytes32 indexed role, address indexed account, address indexed sender);
    event RoleAdminChanged(bytes32 indexed role, bytes32 indexed previousAdminRole, bytes32 indexed newAdminRole);
    
    // Role data structure
    struct RoleData {
        mapping(address => bool) members;
        bytes32 adminRole;
    }
    
    // Mapping from role to role data
    mapping(bytes32 => RoleData) private _roles;
    
    /**
     * @dev Modifier to check if caller has the specified role
     */
    modifier onlyRole(bytes32 role) {
        require(hasRole(role, msg.sender), "AccessControl: account missing role");
        _;
    }
    
    /**
     * @dev Check if an account has a specific role
     */
    function hasRole(bytes32 role, address account) public view returns (bool) {
        return _roles[role].members[account];
    }
    
    /**
     * @dev Get the admin role for a given role
     */
    function getRoleAdmin(bytes32 role) public view returns (bytes32) {
        return _roles[role].adminRole;
    }
    
    /**
     * @dev Grant a role to an account
     */
    function grantRole(bytes32 role, address account) public {
        require(hasRole(getRoleAdmin(role), msg.sender), "AccessControl: sender must be an admin");
        _grantRole(role, account);
    }
    
    /**
     * @dev Revoke a role from an account
     */
    function revokeRole(bytes32 role, address account) public {
        require(hasRole(getRoleAdmin(role), msg.sender), "AccessControl: sender must be an admin");
        _revokeRole(role, account);
    }
    
    /**
     * @dev Renounce a role (can only be called by the account itself)
     */
    function renounceRole(bytes32 role, address account) public {
        require(account == msg.sender, "AccessControl: can only renounce roles for self");
        _revokeRole(role, account);
    }
    
    /**
     * @dev Set up initial roles during contract deployment
     */
    function _setupRole(bytes32 role, address account) internal {
        _grantRole(role, account);
    }
    
    /**
     * @dev Set the admin role for a given role
     */
    function _setRoleAdmin(bytes32 role, bytes32 adminRole) internal {
        bytes32 previousAdminRole = getRoleAdmin(role);
        _roles[role].adminRole = adminRole;
        emit RoleAdminChanged(role, previousAdminRole, adminRole);
    }
    
    /**
     * @dev Internal function to grant a role
     */
    function _grantRole(bytes32 role, address account) private {
        if (!hasRole(role, account)) {
            _roles[role].members[account] = true;
            emit RoleGranted(role, account, msg.sender);
        }
    }
    
    /**
     * @dev Internal function to revoke a role
     */
    function _revokeRole(bytes32 role, address account) private {
        if (hasRole(role, account)) {
            _roles[role].members[account] = false;
            emit RoleRevoked(role, account, msg.sender);
        }
    }
    
    /**
     * @dev Check if multiple accounts have required roles (batch check)
     */
    function hasRoles(bytes32[] memory roles, address[] memory accounts) 
        external 
        view 
        returns (bool[] memory) {
        require(roles.length == accounts.length, "Arrays length mismatch");
        
        bool[] memory results = new bool[](roles.length);
        for (uint256 i = 0; i < roles.length; i++) {
            results[i] = hasRole(roles[i], accounts[i]);
        }
        return results;
    }
    
    /**
     * @dev Get all accounts with a specific role (expensive operation, use carefully)
     */
    function getRoleMembers(bytes32 role, address[] memory candidates) 
        external 
        view 
        returns (address[] memory) {
        uint256 count = 0;
        
        // First pass: count members
        for (uint256 i = 0; i < candidates.length; i++) {
            if (hasRole(role, candidates[i])) {
                count++;
            }
        }
        
        // Second pass: collect members
        address[] memory members = new address[](count);
        uint256 index = 0;
        for (uint256 i = 0; i < candidates.length; i++) {
            if (hasRole(role, candidates[i])) {
                members[index] = candidates[i];
                index++;
            }
        }
        
        return members;
    }
}