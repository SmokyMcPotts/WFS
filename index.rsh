'reach 0.1';

const commonInt = {
    reportTransfer: Fun([UInt], Null),
    reportPayment: Fun([UInt], Null),
    reportCancellation: Fun([], Null)
};

const sellerInt = {
    ...commonInt,
    price: UInt,
    wisdom: Bytes(256),
    reportReady: Fun([UInt], Null),
};

const buyerInt = {
    ...commonInt,
    confirmPurchase: Fun([UInt], Bool),
    reportWisdom: Fun([Bytes(256)], Null)
};

export const main = Reach.App(() => {
    const S = Participant('Seller', sellerInt);
    const B = Participant('Buyer', buyerInt);
    init();

    S.only(() => { const price = declassify(interact.price); });
    S.publish(price);
    S.interact.reportReady(price);
    commit();

    B.only(() => { const willBuy = declassify(interact.confirmPurchase(price)); });
    B.publish(willBuy);
    if (!willBuy) {
      commit();
      each([S, B], () => interact.reportCancellation());
      exit();
    } else {
      commit();
    }

    B.pay(price);
    each([S, B], () => interact.reportPayment(price));
    commit();

    S.only(() => { const wisdom = declassify(interact.wisdom); });
    S.publish(wisdom);
    transfer(price).to(S);
    commit();
    
    each([S, B], () => interact.reportTransfer(price));
    B.interact.reportWisdom(wisdom);

    exit();
});