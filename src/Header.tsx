import styles from "./App.module.css";
import { Account, BaseWallet } from '@polkadot-onboard/core';
import {
    Select,
    SelectTrigger,
    SelectPlaceholder,
    SelectValue,
    SelectIcon,
    SelectContent,
    SelectListbox,
    SelectOption,
    SelectOptionText,
    SelectOptionIndicator,
} from "@hope-ui/solid";
import { For, createEffect, createSignal, Accessor, Setter } from "solid-js";

interface IProps {
    selected: Accessor<{ account: Account, wallet: BaseWallet } | undefined>;
    setSelected: Setter<{ account: Account, wallet: BaseWallet }>;
    accounts: Accessor<{ account: Account, wallet: BaseWallet }[]>;
}

const Header = (props: IProps) => {
    const [s, ss] = createSignal<string>();

    createEffect(() => {
        const n = props.selected();

        if (!n) return;

        ss(n.account.address);
    });

  return (
      <div class={styles.Header}>
          <div class={styles.Title}>Burn Your KSM! 🔥🐦‍⬛</div>
          <Select value={s()} onChange={(v) => {
              const a = props.accounts().find((sel) => sel.account.address == v);

              if (!a) return;

              props.setSelected(a);
          }}>
              <SelectTrigger>
                  <SelectPlaceholder>Select Account</SelectPlaceholder>
                  <SelectValue />
                  <SelectIcon />
              </SelectTrigger>
              <SelectContent>
                  <SelectListbox>
                      <For each={props.accounts()}>
                          {item => (
                              <SelectOption value={item.account.address}>
                                  <SelectOptionText>{item.account.name}</SelectOptionText>
                                  <SelectOptionIndicator />
                              </SelectOption>
                          )}
                      </For>
                  </SelectListbox>
              </SelectContent>
          </Select>
      </div>
  );
};

export default Header;
