import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Category {
  id: number;
  name: string;
}

export interface Tag {
  id: number;
  name: string;
}

@Injectable({ providedIn: 'root' })
export class CategoryService {
  private readonly categoriesUrl = 'http://localhost:8080/categories';

  constructor(private readonly http: HttpClient) {}

  getForUser(userId: number): Observable<Category[]> {
    return this.http.get<Category[]>(this.categoriesUrl, {
      params: new HttpParams().set('userId', userId),
    });
  }

  create(userId: number, name: string): Observable<Category> {
    return this.http.post<Category>(this.categoriesUrl, { name, userId });
  }

  update(categoryId: number, name: string): Observable<Category> {
    return this.http.put<Category>(`${this.categoriesUrl}/${categoryId}`, { name });
  }

  delete(categoryId: number): Observable<void> {
    return this.http.delete<void>(`${this.categoriesUrl}/${categoryId}`);
  }
}

@Injectable({ providedIn: 'root' })
export class TagService {
  private readonly tagsUrl = 'http://localhost:8080/tags';

  constructor(private readonly http: HttpClient) {}

  getForUser(userId: number): Observable<Tag[]> {
    return this.http.get<Tag[]>(this.tagsUrl, {
      params: new HttpParams().set('userId', userId),
    });
  }

  create(userId: number, name: string): Observable<Tag> {
    return this.http.post<Tag>(this.tagsUrl, { name, userId });
  }

  update(tagId: number, name: string): Observable<Tag> {
    return this.http.put<Tag>(`${this.tagsUrl}/${tagId}`, { name });
  }

  delete(tagId: number): Observable<void> {
    return this.http.delete<void>(`${this.tagsUrl}/${tagId}`);
  }
}
