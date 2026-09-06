# Savings connector Recovery Kits

The emergency page can open a version-1 connector kit saved by Vaulted. It
rebuilds the key origin, Savings script, existing recovery trees, and complete
Savings and boarding commitment before displaying the vault. Changed public
facts fail verification.

Connector kits currently contain public recovery information. They identify the
vault and its recovery paths but contain no passkey unlock envelope. The page
therefore displays them as maps. Use Vaulted's Recovery flow with the enrolled
passkey, or compatible recovery tools with the required keys. Version-3 maps
and version-4 kits with unlock envelopes keep their existing behavior.

The connector's conventional signer input applies to normal Savings withdrawals.
It does not establish hardware support for directly signing custom recovery
scripts. The wallet and runtime retain the existing recovery model and its
separate signer requirements.

Twelve public cross-language fixtures cover both networks, Standard and
Advanced protection, and conventional signer origins. The standalone tests
also retain legacy network-policy and kit checks. The browser bundle imports
its network from the kit and does not require the wallet's Vite build settings.
