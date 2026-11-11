import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Transaction {
  id: number;
  amount: number;
  categoryId: number;
  currency: string;
  date: string;
  description: string;
  reducesBalance: boolean;
  tags: Array<{ id: number; name: string }>;
  userId: number;
}

export interface CreateTransactionRequest {
  amount: number;
  categoryId: number;
  currency: string;
  date: string;
  description?: string;
  reducesBalance: boolean;
  tagIds?: number[];
  userId: number;
}

export interface UpdateTransactionRequest {
  amount?: number;
  categoryId?: number;
  currency?: string;
  date?: string;
  description?: string;
  reducesBalance?: boolean;
  tagIds?: number[];
}

@Injectable({ providedIn: 'root' })
export class TransactionService {
  private readonly transactionsUrl = 'http://localhost:8080/transactions';

  constructor(private readonly http: HttpClient) {}

  getForUser(userId: number): Observable<Transaction[]> {
    const params = new HttpParams().set('userId', userId);
    return this.http.get<Transaction[]>(this.transactionsUrl, { params });
  }

  create(transaction: CreateTransactionRequest): Observable<Transaction> {
    return this.http.post<Transaction>(this.transactionsUrl, transaction);
  }

  update(id: number, transaction: UpdateTransactionRequest): Observable<Transaction> {
    return this.http.put<Transaction>(`${this.transactionsUrl}/${id}`, transaction);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.transactionsUrl}/${id}`);
  }
}
