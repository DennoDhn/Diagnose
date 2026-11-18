#!/usr/bin/env bash
# GPU DIAGNOSE v1.1: Linux Live USB baseline. READ ONLY.
# No sudo, package install, register access, bus scan, files created or network requests.
set +e
echo 'GPU-DIAG-LINUX-BEGIN'
printf 'KERNEL: '; uname -r
printf 'OS: '; if [ -r /etc/os-release ]; then sed -n 's/^PRETTY_NAME=//p' /etc/os-release | head -n 1; else echo 'unknown'; fi
printf 'ARCH: '; uname -m
echo '--- GPU PCI ---'
if command -v lspci >/dev/null 2>&1; then
    lspci -Dnnk | grep -E -i -A 4 'VGA compatible controller|3D controller|Display controller'
else
    echo 'lspci: not installed'
fi
echo '--- DRM PCI IDs ---'
for d in /sys/class/drm/card[0-9]/device /sys/class/drm/card[0-9][0-9]/device; do
    [ -d "$d" ] || continue
    printf 'DRM_DEVICE: %s ' "$d"
    for field in vendor device subsystem_vendor subsystem_device; do
        if [ -r "$d/$field" ]; then printf '%s=%s ' "$field" "$(cat "$d/$field")"; fi
    done
    if [ -L "$d/driver" ]; then printf 'driver=%s ' "$(basename "$(readlink -f "$d/driver")")"; fi
    echo
done
echo '--- KERNEL MODULES ---'
if command -v lsmod >/dev/null 2>&1; then
    lsmod | grep -E '^(amdgpu|i2c_dev|i2c_algo_bit|drm_)' || echo 'No matching loaded modules'
else
    echo 'lsmod not available'
fi
echo '--- I2C DEVICE NODES (existence only) ---'
found=0
for d in /dev/i2c-*; do
    [ -e "$d" ] || continue
    found=1
    ls -l "$d"
done
[ "$found" -eq 1 ] || echo 'No /dev/i2c device nodes found'
echo 'GPU-DIAG-LINUX-END'
