"use client";

import React, { createContext, useContext } from "react";

export interface PermissionsContextType {
  accessLevel: "SUPER_ADMIN" | "ADMIN" | "USER";
  roles: string[];
  permissions: string[];
  isSuperAdmin: boolean;
  isAdmin: boolean;
  can: (permissionCode: string) => boolean;
  hasAny: (permissionCodes: string[]) => boolean;
  hasAll: (permissionCodes: string[]) => boolean;
  hasModule: (moduleName: string) => boolean;
}

const PermissionsContext = createContext<PermissionsContextType>({
  accessLevel: "USER",
  roles: [],
  permissions: [],
  isSuperAdmin: false,
  isAdmin: false,
  can: () => false,
  hasAny: () => false,
  hasAll: () => false,
  hasModule: () => false,
});

export interface PermissionsProviderProps {
  user: {
    accessLevel?: "SUPER_ADMIN" | "ADMIN" | "USER";
    roles?: string[];
    permissions?: string[];
  };
  children: React.ReactNode;
}

export const PermissionsProvider: React.FC<PermissionsProviderProps> = ({ children }) => {
  return (
    <PermissionsContext.Provider
      value={{
        accessLevel: "SUPER_ADMIN",
        roles: ["SUPER_ADMIN"],
        permissions: ["*"],
        isSuperAdmin: true,
        isAdmin: true,
        can: () => true,
        hasAny: () => true,
        hasAll: () => true,
        hasModule: () => true,
      }}
    >
      {children}
    </PermissionsContext.Provider>
  );
};

export const usePermissions = () => useContext(PermissionsContext);
