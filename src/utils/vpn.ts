import { executeCommand } from "./shell";
import { TaskConfig } from "../types";

export async function isVPNActive(vpnProfile: string): Promise<boolean> {
  try {
    const state = await executeCommand(
      `osascript -e 'tell application "Tunnelblick" to get state of first configuration where name = "${vpnProfile}"'`
    );
    return state === "CONNECTED";
  } catch (error) {
    console.error(`[vpn] Failed to check VPN status: ${error instanceof Error ? error.message : "Unknown error"}`);
    return false;
  }
}

export async function connectVPN(vpnProfile: string): Promise<void> {
  try {
    console.log(`[vpn] Connecting to VPN profile: ${vpnProfile}...`);
    await executeCommand(
      `osascript -e 'tell application "Tunnelblick" to connect "${vpnProfile}"'`
    );
    
    // Wait for connection to establish (poll for up to 30 seconds)
    const maxAttempts = 30;
    const delayMs = 1000;
    
    for (let i = 0; i < maxAttempts; i++) {
      await new Promise(resolve => setTimeout(resolve, delayMs));
      
      if (await isVPNActive(vpnProfile)) {
        console.log(`[vpn] Successfully connected to ${vpnProfile}`);
        return;
      }
      
      if (i % 5 === 0) {
        console.log(`[vpn] Still connecting... (${i}s elapsed)`);
      }
    }
    
    throw new Error(`VPN connection timed out after ${maxAttempts} seconds`);
  } catch (error) {
    throw new Error(
      `[vpn] Failed to connect to VPN: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

export async function ensureVPNConnection(config: TaskConfig): Promise<void> {
  if (!config.vpn.enabled) {
    console.log("[vpn] VPN check disabled in configuration");
    return;
  }

  const vpnProfile = config.vpn.profile;
  
  if (!vpnProfile) {
    throw new Error("[vpn] VPN profile not configured");
  }

  console.log(`[vpn] Checking VPN connection (profile: ${vpnProfile})...`);
  
  if (await isVPNActive(vpnProfile)) {
    console.log("[vpn] VPN is already connected");
    return;
  }

  console.log("[vpn] VPN is not connected, attempting to connect...");
  await connectVPN(vpnProfile);
}
