;; OMI Portal reference Guix System fabric.
;;
;; This file is a declarative blueprint for future full-system provisioning. It
;; is intentionally not part of the default build/test path; the active v1 gate
;; uses Docker Buildx for Node 24 user-mode validation and Dockerfile.softmmu for
;; full-system emulator checks.

(use-modules (gnu)
             (gnu bootloader grub)
             (gnu services networking)
             (gnu services ssh)
             (gnu system file-systems))

(operating-system
  (host-name "omi-virtual-fabric")
  (timezone "Etc/UTC")
  (locale "en_US.utf8")

  (bootloader
   (bootloader-configuration
    (bootloader grub-bootloader)
    (targets '("/dev/vda"))))

  (file-systems
   (cons (file-system
           (device (file-system-label "omi-root"))
           (mount-point "/")
           (type "ext4"))
         %base-file-systems))

  (services
   (cons* (service dhcp-client-service-type)
          (service openssh-service-type
                   (openssh-configuration
                    (port-number 22)
                    (permit-root-login 'prohibit-password)))
          %base-services)))
