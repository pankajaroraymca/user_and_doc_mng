import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import * as https from 'https';

class AxiosHelper {
    private axiosInstance: AxiosInstance;

    constructor(baseURL: string, timeout: number = 10000) {
        // Disable SSL verification for development (this is insecure)
        const agent = new https.Agent({
            rejectUnauthorized: false, // Disable certificate validation (insecure)
        });
        this.axiosInstance = axios.create({
            baseURL,
            timeout,
            httpsAgent: agent,
        });

        // Interceptors for request
        this.axiosInstance.interceptors.request.use(
            (config: InternalAxiosRequestConfig) => {
                // Modify request config before sending the request
                console.log(`Request to ${config.url}`);
                return config;
            },
            (error) => {
                // Handle request error
                return Promise.reject(error);
            }
        );

        // Interceptors for response
        this.axiosInstance.interceptors.response.use(
            (response: AxiosResponse) => {
                // Modify response data if needed
                console.log(`Response from ${response.config.url}:`, response.status);
                return response;
            },
            (error) => {
                // Handle response error
                return Promise.reject(error);
            }
        );
    }

    public async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
        try {
            const response: AxiosResponse<T> = await this.axiosInstance.get(url, config);
            return response.data;
        } catch (error) {
            throw error;
        }
    }

    public async post<T>(url: string, data: any, config?: AxiosRequestConfig): Promise<T> {
        try {
            const response: AxiosResponse<T> = await this.axiosInstance.post(url, data, config);
            return response.data;
        } catch (error) {
            throw error;
        }
    }

    public async put<T>(url: string, data: any, config?: AxiosRequestConfig): Promise<T> {
        try {
            const response: AxiosResponse<T> = await this.axiosInstance.put(url, data, config);
            return response.data;
        } catch (error) {
            throw error;
        }
    }

    public async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
        try {
            const response: AxiosResponse<T> = await this.axiosInstance.delete(url, config);
            return response.data;
        } catch (error) {
            throw error;
        }
    }
}

export default AxiosHelper;
