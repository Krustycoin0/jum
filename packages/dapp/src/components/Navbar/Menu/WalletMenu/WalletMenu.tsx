import { getChainById } from '@lifi/sdk';
import { Wallet, supportedWallets } from '@lifi/wallet-management';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import LaunchIcon from '@mui/icons-material/Launch';
import PowerSettingsNewIcon from '@mui/icons-material/PowerSettingsNew';
import { Breakpoint, Grid, Typography, useTheme } from '@mui/material';
import MuiAlert from '@mui/material/Alert';
import Avatar from '@mui/material/Avatar';
import Snackbar from '@mui/material/Snackbar';
import { MenuKeys } from '@transferto/dapp/src/const';
import { useUserTracking } from '@transferto/dapp/src/hooks';
import { useWallet } from '@transferto/dapp/src/providers/WalletProvider';
import { useSettingsStore } from '@transferto/dapp/src/stores';
import { useMenuStore } from '@transferto/dapp/src/stores/menu';
import { EventTrackingTool } from '@transferto/dapp/src/types';
import { SpotButton } from '@transferto/shared/src/atoms';
import { openInNewTab, walletDigest } from '@transferto/shared/src/utils';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { shallow } from 'zustand/shallow';
import { NavbarMenu } from '../../index';

interface NavbarMenuProps {
  handleClose: (event: MouseEvent | TouchEvent) => void;
}
export const WalletMenu = ({ handleClose }: NavbarMenuProps) => {
  const i18Path = 'navbar.walletMenu.';
  const [copiedToClipboard, setCopiedToClipboard] = useState(false);
  const { t: translate } = useTranslation();
  const theme = useTheme();
  const { account, usedWallet, disconnect } = useWallet();
  const { trackPageload, trackEvent } = useUserTracking();
  const walletSource = supportedWallets;
  const [
    openNavbarWalletMenu,
    onOpenNavbarWalletMenu,
    openNavbarSubMenu,
    onCloseAllNavbarMenus,
  ] = useMenuStore(
    (state) => [
      state.openNavbarWalletMenu,
      state.onOpenNavbarWalletMenu,
      state.openNavbarSubMenu,
      state.onCloseAllNavbarMenus,
    ],
    shallow,
  );

  const onWalletDisconnect = useSettingsStore(
    (state) => state.onWalletDisconnect,
  );

  const walletIcon: string = useMemo(() => {
    if (!!usedWallet) {
      return usedWallet.icon;
    } else {
      const walletKey: any = Object.keys(walletSource).filter(
        (el: string, index: number) =>
          walletSource[index].name === localStorage.activeWalletName,
      );
      return walletSource[walletKey]?.icon || '';
    }
  }, [usedWallet, walletSource]);

  const _walletDigest = useMemo(() => {
    return walletDigest(account);
  }, [account]);

  const handleCloseSnackbar = (
    event?: React.SyntheticEvent | Event,
    reason?: string,
  ) => {
    if (reason === 'clickaway') {
      return;
    }
    setCopiedToClipboard(false);
  };

  const handleExploreButton = () => {
    account.chainId &&
      openInNewTab(
        `${
          getChainById(account.chainId).metamask.blockExplorerUrls[0]
        }address/${account.address}`,
      );
    onCloseAllNavbarMenus();
    trackPageload({
      source: 'connected-menu',
      destination: 'blokchain-explorer',
      url: !!account.chainId
        ? `${
            getChainById(account.chainId).metamask.blockExplorerUrls[0]
          }address/${account.address}`
        : '',
      pageload: true,
      disableTrackingTool: [EventTrackingTool.ARCx],
    });
  };

  const handleCopyButton = () => {
    account.address && navigator?.clipboard?.writeText(account.address);
    setCopiedToClipboard(true);
    trackEvent({
      category: 'menu',
      action: 'copyAddressToClipboard',
      label: 'copyAddressToClipboard',
      disableTrackingTool: [EventTrackingTool.ARCx, EventTrackingTool.Raleon],
    });
    onCloseAllNavbarMenus();
  };

  const handleDisconnectButton = () => {
    disconnect();
    onCloseAllNavbarMenus();
    onWalletDisconnect();
  };

  useEffect(() => {
    openNavbarWalletMenu! && setCopiedToClipboard(false);
  }, [openNavbarWalletMenu]);

  return !!openNavbarWalletMenu ? (
    <NavbarMenu
      open={true}
      transformOrigin={'top left'}
      setOpen={onOpenNavbarWalletMenu}
      handleClose={handleClose}
      isOpenSubMenu={openNavbarSubMenu !== MenuKeys.None}
    >
      <Grid
        container
        m={`${theme.spacing(6)} auto !important`}
        sx={{
          maxWidth: '360px',
          [theme.breakpoints.up('sm' as Breakpoint)]: {
            maxWidth: 'auto',
          },
        }}
      >
        <Grid item xs={12} textAlign={'center'} mb={theme.spacing(6)}>
          <Avatar
            src={walletIcon}
            sx={{
              padding: theme.spacing(4.5),
              background:
                theme.palette.mode === 'light'
                  ? theme.palette.black.main
                  : theme.palette.white.main,
              margin: 'auto',
              height: '96px',
              width: '96px',
            }}
          />
          <Typography variant="lifiBodyLargeStrong" mt={theme.spacing(4)}>
            {_walletDigest}
          </Typography>
        </Grid>
        <Grid item xs={4}>
          <SpotButton name="Copy" onClick={handleCopyButton}>
            <ContentCopyIcon />
          </SpotButton>
        </Grid>
        <Grid item xs={4}>
          <SpotButton name="Explore" onClick={handleExploreButton}>
            <LaunchIcon />
          </SpotButton>
        </Grid>
        <Grid item xs={4}>
          <SpotButton
            name={translate(`${i18Path}disconnect`)}
            variant={'primary'}
            onClick={handleDisconnectButton}
          >
            <PowerSettingsNewIcon />
          </SpotButton>
        </Grid>
      </Grid>
    </NavbarMenu>
  ) : (
    <Snackbar
      open={copiedToClipboard}
      autoHideDuration={2000}
      onClose={handleCloseSnackbar}
      anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      sx={{ top: '78px !important' }}
    >
      <MuiAlert elevation={6} variant="filled" severity="success">
        {translate(`${i18Path}copiedMsg`)}
      </MuiAlert>
    </Snackbar>
  );
};
