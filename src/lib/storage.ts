import { type Movie, type InsertMovie, type UserFavorite, type InsertUserFavorite } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Movie operations
  getMovie(id: number): Promise<Movie | undefined>;
  getMovies(limit?: number, offset?: number): Promise<Movie[]>;
  searchMovies(query: string, limit?: number): Promise<Movie[]>;
  getMoviesByGenre(genre: string, limit?: number): Promise<Movie[]>;
  createMovie(movie: InsertMovie): Promise<Movie>;
  updateMovie(id: number, movie: Partial<InsertMovie>): Promise<Movie | undefined>;
  
  // User favorites
  getUserFavorites(userId: string): Promise<UserFavorite[]>;
  addUserFavorite(favorite: InsertUserFavorite): Promise<UserFavorite>;
  removeUserFavorite(userId: string, movieId: number): Promise<boolean>;
  
  // User operations (existing)
  getUser(id: string): Promise<any>;
  getUserByUsername(username: string): Promise<any>;
  createUser(user: any): Promise<any>;
}

export class MemStorage implements IStorage {
  private movies: Map<number, Movie>;
  private userFavorites: Map<string, UserFavorite>;
  private users: Map<string, any>;

  constructor() {
    this.movies = new Map();
    this.userFavorites = new Map();
    this.users = new Map();
  }

  // Movie operations
  async getMovie(id: number): Promise<Movie | undefined> {
    return this.movies.get(id);
  }

  async getMovies(limit = 20, offset = 0): Promise<Movie[]> {
    const allMovies = Array.from(this.movies.values());
    return allMovies.slice(offset, offset + limit);
  }

  async searchMovies(query: string, limit = 20): Promise<Movie[]> {
    const searchTerm = query.toLowerCase();
    const results = Array.from(this.movies.values()).filter(movie =>
      movie.title.toLowerCase().includes(searchTerm) ||
      movie.genres.some(genre => genre.toLowerCase().includes(searchTerm))
    );
    return results.slice(0, limit);
  }

  async getMoviesByGenre(genre: string, limit = 20): Promise<Movie[]> {
    const results = Array.from(this.movies.values()).filter(movie =>
      movie.genres.some(g => g.toLowerCase() === genre.toLowerCase())
    );
    return results.slice(0, limit);
  }

  async createMovie(insertMovie: InsertMovie): Promise<Movie> {
    const movie: Movie = {
      ...insertMovie,
      created_at: new Date(),
    };
    this.movies.set(movie.id, movie);
    return movie;
  }

  async updateMovie(id: number, updateData: Partial<InsertMovie>): Promise<Movie | undefined> {
    const existing = this.movies.get(id);
    if (!existing) return undefined;
    
    const updated: Movie = { ...existing, ...updateData };
    this.movies.set(id, updated);
    return updated;
  }

  // User favorites
  async getUserFavorites(userId: string): Promise<UserFavorite[]> {
    return Array.from(this.userFavorites.values()).filter(
      favorite => favorite.userId === userId
    );
  }

  async addUserFavorite(insertFavorite: InsertUserFavorite): Promise<UserFavorite> {
    const id = randomUUID();
    const favorite: UserFavorite = {
      ...insertFavorite,
      id,
      created_at: new Date(),
    };
    this.userFavorites.set(id, favorite);
    return favorite;
  }

  async removeUserFavorite(userId: string, movieId: number): Promise<boolean> {
    const favoriteToRemove = Array.from(this.userFavorites.entries()).find(
      ([_, favorite]) => favorite.userId === userId && favorite.movieId === movieId
    );
    
    if (favoriteToRemove) {
      this.userFavorites.delete(favoriteToRemove[0]);
      return true;
    }
    return false;
  }

  // User operations (existing)
  async getUser(id: string): Promise<any> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<any> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: any): Promise<any> {
    const id = randomUUID();
    const user: any = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }
}

export const storage = new MemStorage();