import { loadStdlib } from '@reach-sh/stdlib';
import * as backend from './build/index.main.mjs';
import { ask } from '@reach-sh/stdlib';

if (process.argv.length < 3 || ['seller', 'buyer'].includes(process.argv[2]) == false) {
    console.log('Usage: reach run index [seller|buyer]');
    process.exit(0);
}
const role = process.argv[2];
console.log(`Your role is ${role}`);

const stdlib = loadStdlib(process.env);
if (stdlib.connector === 'ALGO') {
    console.log(`The consensus network is ${stdlib.connector}.`);
} else {
    console.log(`The consensus network is ${stdlib.connector} but you should consider ALGO.`);
}
const suStr = stdlib.standardUnit;
const toAU = (su) => stdlib.parseCurrency(su);
const toSU = (au) => stdlib.formatCurrency(au, 4);
const iBal = toAU(1000);
const showBal = async (account) => console.log(`Your balance is ${toSU(await stdlib.balanceOf(account))} ${suStr}`);

const commonInt = (role) => ({
    reportTransfer: (payment) => { console.log(`The contract paid ${toSU(payment)} ${suStr} to ${role == 'seller' ? 'you' : 'the seller'}.`) },
    reportPayment: (payment) => { console.log(`${role == 'buyer' ? 'You' : 'The buyer'} paid ${toSU(payment)} ${suStr} to the contract.`) },
    reportCancellation: () => { console.log(`${role == 'buyer' ? 'You' : 'The buyer'} cancelled the order.`); }
});

if (role === 'seller') {
    const sellerInt = {
        ...commonInt(role),
        price: toAU(5),
        wisdom: await ask.ask('Enter a wise phrase, or press "enter" for default:', (s) => {
            let w = !s ? 'Build healthy communities.' : s;
            if (!s) { console.log(w); }
            return w;    
        }),
        reportReady: async (price) => {
            console.log(`Your wisdom is for sale at ${toSU(price)} ${suStr}.`);
            console.log(`Contract info: ${JSON.stringify(await ctc.getInfo())}`);
        }
    };

    const account = await stdlib.newTestAccount(iBal);
    await showBal(account);
    const ctc = account.contract(backend);
    await ctc.participants.Seller(sellerInt);
    await showBal(account);

} else {
    const buyerInt = {
        ...commonInt(role),
        confirmPurchase: async (price) => await ask.ask(`Do you want to purchase wisdom for ${toSU(price)} ${suStr}?`, ask.yesno),
        reportWisdom: (wisdom) => console.log(`Your new wisdom is "${wisdom}"`),
    };

    const account = await stdlib.newTestAccount(iBal);
    const info = await ask.ask('Paste contract info:', (s) => JSON.parse(s));
    const ctc = account.contract(backend, info);
    await showBal(account);
    await ctc.p.Buyer(buyerInt);
    await showBal(account);
};
ask.done();