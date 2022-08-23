import Head from "next/head";
import Image from "next/image";
import styles from "../styles/Home.module.css";
import { useEffect, useState, useRef } from "react";
import Web3Modal from "web3modal";
import { providers, Contract, BigNumber } from "ethers";
import { abi, WHITELIST_CONTRACT_ADDRESS } from "../constants";

export default function Home() {
  const [numOfWhitelisted, setNumOfWhitelisted] = useState(0);
  const [walletConnected, setWalletConnected] = useState(false);
  const [joinedWhitelist, setJoinedWhitelist] = useState(false);
  const [loading, setLoading] = useState(false);
  const web3ModalRef = useRef();

  async function getProviderOrSigner(needSigner = false) {
    try {
      const provider = await web3ModalRef.current.connect();
      const web3Provider = new providers.Web3Provider(provider);

      const { chainId } = await web3Provider.getNetwork();
      if (chainId != 4) {
        window.alert("change the network to Rinkeby");
        throw new Error("Change the network to rinkeby");
      }
      if (needSigner) {
        const signer = web3Provider.getSigner();
        return signer;
      } else {
        return web3Provider;
      }
    } catch (error) {
      console.log(error);
    }
  }

  async function checkIfAddressIsWhitelisted() {
    try {
      const signer = await getProviderOrSigner(true);
      const whitelistContract = new Contract(
        WHITELIST_CONTRACT_ADDRESS,
        abi,
        signer
      );

      const address = await signer.getAddress();
      const _joinedWhitelist = await whitelistContract.whitelistedAddress(
        address
      );
      setJoinedWhitelist(_joinedWhitelist);
    } catch (error) {
      console.log(error);
    }
  }

  async function getNumberOfWhitelisted() {
    try {
      const provider = await getProviderOrSigner();
      const whitelistContract = new Contract(
        WHITELIST_CONTRACT_ADDRESS,
        abi,
        provider
      );
      const _numOfWhitelisted =
        await whitelistContract.numAddressesWhitelisted();
      setNumOfWhitelisted(_numOfWhitelisted);
    } catch (error) {
      console.log(error);
    }
  }

  async function addAddressToWhitelist() {
    try {
      const signer = await getProviderOrSigner(true);
      const whitelistContract = new Contract(
        WHITELIST_CONTRACT_ADDRESS,
        abi,
        signer
      );
      const tx = await whitelistContract.addAddressToWhitelist();
      setLoading(true);
      await tx.wait();
      setLoading(false);
      await getNumberOfWhitelisted();
      setJoinedWhitelist(true);
    } catch (error) {
      console.log(error);
    }
  }

  const renderButton = () => {
    if (walletConnected) {
      if (joinedWhitelist) {
        return <div>Thanks For Joining the Whitelist &#10084;</div>;
      } else {
        return (
          <button onClick={addAddressToWhitelist} className={styles.button}>
            {loading ? "Loading..." : "Join the Whitelist"}
          </button>
        );
      }
    } else {
      return (
        <button onClick={connectWallet} className={styles.button}>
          Connect Wallet
        </button>
      );
    }
  };

  async function connectWallet() {
    try {
      await getProviderOrSigner();
      setWalletConnected(true);
      await checkIfAddressIsWhitelisted();
      await getNumberOfWhitelisted();
    } catch (error) {
      console.log(error);
    }
  }

  useEffect(() => {
    if (!walletConnected) {
      web3ModalRef.current = new Web3Modal({
        network: "rinkeby",
        providerOptions: {},
        disableInjectedProvider: false,
      });

      connectWallet();
    }
  }, [walletConnected]);

  return (
    <div>
      <Head>
        <title>Whitelist dApp</title>
        <meta name="description" content="Whitelist-dApp" />
      </Head>
      <div className={styles.main}>
        <div style={{ margin: "50px" }}>
          <h1 className={styles.title}>Welcome to Crypto Devs!</h1>
          <div className={styles.description}>
            {numOfWhitelisted} have already joined the Whitelist
          </div>
          {renderButton()}
        </div>
        <div>
          <img className={styles.image} src="./crypto-devs.svg" />
        </div>
      </div>
      <footer className={styles.footer}>
        Made with &#10084; from Crypto Devs
      </footer>
    </div>
  );
}
