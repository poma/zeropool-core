// import { Injectable } from '@nestjs/common';
// // import * as ZeroPoolNetwork from '../../lib/zero-pool-network';
// import * as ZeroPoolContract from '../../lib/ethereum/zeropool-contract';
// import { HdWallet, DomainEthereum } from '@buttonwallet/blockchain-ts-wallet-core';
// import { AppConfig, Mnemonic, NetworkConfig } from './app.config';
// import { TransactionDto } from './transaction.dto';
// import { Observable, of, race, Subject, timer } from 'rxjs';
// import { bufferTime, catchError, concatMap, filter, flatMap, map, switchMap, take } from 'rxjs/operators';
// import { fromPromise } from 'rxjs/internal-compatibility';
//
// const crypto = require('crypto');
// const hash = crypto.createHash('sha256');
//
// enum TxProcessingStatus {
//   publishedInZpBlock,
//   internalError,
//   rejectedByRelayer,
//   processingTimeout
// }
//
// type Tx = {
//   id: string,
//   payload: TransactionDto,
//   error?: string // This set might be set during the processing in a pipeline
// }
//
// const calculateTxId = (tx: TransactionDto) => {
//   hash.update(JSON.stringify(tx));
//   return hash.digest('hex');
// };
//
// type ProcessedTx = {
//   id: string
//   status: TxProcessingStatus,
//   payload?: TransactionDto,
//   ethereumTxHash?: string,
//   errorMessage?: string
// }
//
// @Injectable()
// export class AppServiceRx {
//
//   // private zpNetwork: ZeroPoolNetwork;
//   private zpContract: ZeroPoolContract;
//
//   private tx$ = new Subject<Tx>();
//   private processedTx$ = new Subject<ProcessedTx>();
//
//
//   constructor() {
//     // AppConfig.network.mainnet.mnemonic
//     const wallet = new HdWallet(Mnemonic, '');
//     const eth = wallet.generateKeyPair(DomainEthereum.Instance(), 0);
//
//     this.zpContract = new ZeroPoolContract(NetworkConfig.contract, eth.privateKey, NetworkConfig.rpc);
//
//     this.tx$.pipe(
//       bufferTime(AppConfig.txAggregationTime),
//       filter((txs: Array<Tx>) => {
//         return txs.length > 0;
//       }),
//
//         // Publish blocks sequentially, TODO: proper nonce managment could be introduced from this point
//       concatMap((txs: Array<Tx>) => {
//
//         // TODO: @krvbot pad txs to 256,
//         //  how we will define blocknumber_expires ??
//         const blocknumber_expires = 50000000;
//         const zpTxs = txs.map((tx) => {
//           // TODO: here we can remap from strings back BigInt,
//           //  Or we can do that via class-transformer(validator) at DTO level
//           return tx.payload;
//         });
//
//         const $p = this.publishBlock(zpTxs, blocknumber_expires);
//         return fromPromise($p);
//       }),
//       catchError((srcTx: Tx) => {
//         return of({
//           id: srcTx.id,
//           status: TxProcessingStatus.internalError
//         });
//       })
//     ).subscribe((tx: ProcessedTx) => {
//       this.processedTx$.next(tx);
//     });
//   }
//
//   handleTx(tx: TransactionDto): Promise<ProcessedTx> {
//
//     const id = calculateTxId(tx);
//     this.tx$.next({ payload: tx, id });
//
//     // Wait result of our transaction processing
//     const result$ = this.processedTx$.pipe(
//         filter((txId) => txId === id),
//         take(1),
//     );
//
//     // We expect to have pending transaction in a 10sec
//     // Think on this twice
//     const timeout$: Observable<ProcessedTx> = timer(10000).pipe(
//         map(() => {
//           return {
//             id,
//             status: TxProcessingStatus.processingTimeout,
//             errorMessage: 'timeout'
//           };
//         })
//     );
//
//     return race(result$, timeout$).toPromise();
//   }
//
//   async publishBlock(transactions: Array<TransactionDto>, blockNumberExpires: number): Promise<string> {
//     const rollupCurTxNum = await this.zpContract.getRollupTxNum();
//     console.log(rollupCurTxNum)
//     return this.zpContract.publishBlock(transactions, rollupCurTxNum >> 8, blockNumberExpires);
//   }
//
// }
