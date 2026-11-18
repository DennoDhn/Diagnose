#!/usr/bin/env bash
# GPU DIAGNOSE - Linux live session read-only baseline
# No sudo, no writes to device registers, no installation and no network.
set +e
echo 'GPU-DIAG-LINUX-BEGIN'
printf 'Timestamp: '; date -Is
printf 'Kernel: '; uname -r
printf 'Distribution: '; if [ -f /etc/os-release ]; then . /etc/os-release; echo "$PRETTY_NAME"; else echo unknown; fi
echo '--- Display PCI devices ---'
if command -v lspci >/dev/null 2>&1; then
  lspci -nnk | grep -E -i -A 4 'VGA compatible controller|3D controller|Display controller'
else
  echo 'lspci not installed'
fi
echo '--- Kernel DRM devices ---'
for dev in /sys/class/drm/card[0-9]*/device; do
  if [ -d "$dev" ]; then
    printf '%s ' "$dev"
    for key in vendor device subsystem_vendor subsystem_device; do
      if [ -r "$dev/$key" ]; then printf '%s=%s ' "$key" "$(cat "$dev/$key")"; fi
    done
    echo
  fi
done
echo '--- I2C device nodes (existence only; no bus probing) ---'
ls /dev/i2c-* 2>/dev/null || echo 'No accessible /dev/i2c device nodes'
echo 'GPU-DIAG-LINUX-END'
