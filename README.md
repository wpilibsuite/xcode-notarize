# Xcode Notarize

This action notarizes macOS applications or plug-ins. It does this by submitting your built `.app` (or non-app bundle) to Apple's notarization service. It will poll the notarization service until it times out of receives a success response.

> Notarization is a complicated process, but the gist of it is this: if you want to distribute your macOS application outside of the Mac App Store, you need to Sign and Notarize your application. This Action only needs two inputs for that: the `product-path` that points your application and your AppStore Connect credentials with `appstore-connect-username` / `appstore-connect-password`. (This need to be an _App Specific Password_ as regular accounts require 2FA)

## Basic Usage

```yaml
- name: "Notarize Release Build"
  uses: wpilibsuite/xcode-notarize@v2
  with:
    product-path: "Export/Rings.app"
    appstore-connect-username: ${{ secrets.NOTARIZATION_USERNAME }}
    appstore-connect-teamid: ${{ secrets.NOTARIZATION_TEAMID }}
    appstore-connect-password: ${{ secrets.NOTARIZATION_PASSWORD }}
```

Note that notarization is not the final step. After Apple has notarized your application, you also want to _staple_ a notarization ticket to your product. This can be done with the [Xcode Staple](https://github.com/marketplace/actions/xcode-staple) action.

## Full Example

The [devbotsxyz/example-macos-rings](https://github.com/devbotsxyz/example-macos-rings) project is an example macOS project with a [release.yml](https://github.com/devbotsxyz/example-macos-rings/.github/workflows/release.yml) workflow that shows all the steps needed to go from creating a release in GitHub to ending up with a `.zip` file that contains a signed and notarized application.

## Related Actions

 * [Carthage Bootstrap](https://github.com/marketplace/actions/xcode-staple) - Bootstrap your Carthage Dependencies/
 * [Xcode Staple](https://github.com/marketplace/actions/xcode-staple) - Staple a Notarization Ticket to your product.

## License and Contributions

This Action is licensed under the [MIT](LICENSE) license. Contributions are very much welcome and encouraged but we would like to ask to file an issue before submitting pull requests. 
