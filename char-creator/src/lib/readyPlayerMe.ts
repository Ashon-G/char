import { z } from 'zod';

// Ready Player Me Configuration
export const RPM_CONFIG = {
  subdomain: 'test-05n8dz', // Just the subdomain, not the full domain
  fullDomain: 'test-05n8dz.readyplayer.me',
  appId: '691b4f5a30c646617b245200',
  orgId: '68ca26b284d3f725e6a99f33',
  apiKey: 'sk_live_1zF9-DrD5gAR_tDQ8nmeOmgBtCQCY9lWpxbU',
  apiUrl: 'https://api.readyplayer.me',
  modelsUrl: 'https://models.readyplayer.me',
};

// Avatar Template Schema
export const AvatarTemplateSchema = z.object({
  id: z.string(),
  imageUrl: z.string(),
  gender: z.enum(['male', 'female']),
});

// Avatar Schema
export const AvatarSchema = z.object({
  id: z.string(),
  partner: z.string().optional(),
  bodyType: z.string().optional(),
  gender: z.string().optional(),
  assets: z.object({
    outfit: z.string().optional(),
    hairStyle: z.string().optional(),
    facialHair: z.string().optional(),
    glasses: z.string().optional(),
    headwear: z.string().optional(),
  }).optional(),
});

// Asset Schema
export const AssetSchema = z.object({
  id: z.string(),
  type: z.string(),
  name: z.string(),
  iconUrl: z.string(),
  gender: z.enum(['male', 'female', 'neutral']),
});

// User Schema
export const UserSchema = z.object({
  id: z.string(),
  token: z.string(),
});

export type AvatarTemplate = z.infer<typeof AvatarTemplateSchema>;
export type Avatar = z.infer<typeof AvatarSchema>;
export type Asset = z.infer<typeof AssetSchema>;
export type User = z.infer<typeof UserSchema>;

// RPM API Client
export class ReadyPlayerMeAPI {
  private token: string | null = null;
  private userId: string | null = null;
  private tokenKey = 'rpm-user-token';
  private userIdKey = 'rpm-user-id';

  constructor() {
    // Load persisted credentials on initialization
    this.loadPersistedCredentials();
  }

  private async loadPersistedCredentials() {
    try {
      const { default: AsyncStorage } = await import('@react-native-async-storage/async-storage');
      const [token, userId] = await Promise.all([
        AsyncStorage.getItem(this.tokenKey),
        AsyncStorage.getItem(this.userIdKey),
      ]);

      if (token && userId) {
        this.token = token;
        this.userId = userId;
        console.log('[RPM API] Loaded persisted user credentials. User ID:', userId);
      }
    } catch (error) {
      console.log('[RPM API] Could not load persisted credentials:', error);
    }
  }

  private async ensureAuthenticated() {
    // Wait for persisted credentials to load if not already loaded
    if (!this.token) {
      await this.loadPersistedCredentials();
    }
    // If still no token, create a new user
    if (!this.token) {
      await this.createAnonymousUser();
    }
  }

  private async persistCredentials(token: string, userId: string) {
    try {
      const { default: AsyncStorage } = await import('@react-native-async-storage/async-storage');
      await Promise.all([
        AsyncStorage.setItem(this.tokenKey, token),
        AsyncStorage.setItem(this.userIdKey, userId),
      ]);
      console.log('[RPM API] Persisted user credentials');
    } catch (error) {
      console.log('[RPM API] Could not persist credentials:', error);
    }
  }

  async createAnonymousUser(): Promise<User> {
    try {
      console.log('[RPM API] Creating anonymous user...');
      const response = await fetch(`${RPM_CONFIG.apiUrl}/v1/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          data: {
            applicationId: RPM_CONFIG.appId,
            requestToken: true, // Request JWT token in response
          },
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[RPM API] User creation failed:', response.status, errorText);
        throw new Error(`Failed to create user: ${response.status} ${errorText}`);
      }

      const responseData = await response.json();
      console.log('[RPM API] Full response:', JSON.stringify(responseData, null, 2));

      // Extract data from response - RPM API wraps response in { data: { ... } }
      const data = responseData.data || responseData;
      console.log('[RPM API] User created. ID:', data.id, 'Has token:', !!data.token);

      this.token = data.token;
      this.userId = data.id;

      // Persist credentials for future sessions
      await this.persistCredentials(data.token, data.id);

      return UserSchema.parse(data);
    } catch (error) {
      console.error('[RPM API] createAnonymousUser error:', error);
      throw error;
    }
  }

  async getAvatarTemplates(): Promise<AvatarTemplate[]> {
    try {
      await this.ensureAuthenticated();

      console.log('[RPM API] Fetching avatar templates...');
      const response = await fetch(`${RPM_CONFIG.apiUrl}/v2/avatars/templates`, {
        headers: {
          Authorization: `Bearer ${this.token}`,
          'X-APP-ID': RPM_CONFIG.appId,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[RPM API] Template fetch failed:', response.status, errorText);
        throw new Error(`Failed to fetch templates: ${response.status} ${errorText}`);
      }

      const data = await response.json();
      console.log('[RPM API] Templates response:', data);

      // Handle different response structures
      const templates = data.data || data;
      return z.array(AvatarTemplateSchema).parse(templates);
    } catch (error) {
      console.error('[RPM API] getAvatarTemplates error:', error);
      throw error;
    }
  }

  async createDraftAvatar(templateId: string, bodyType: 'fullbody' | 'halfbody'): Promise<Avatar> {
    try {
      await this.ensureAuthenticated();

      console.log('[RPM API] Creating draft avatar from template:', templateId);
      const response = await fetch(
        `${RPM_CONFIG.apiUrl}/v2/avatars/templates/${templateId}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.token}`,
            'X-APP-ID': RPM_CONFIG.appId,
          },
          body: JSON.stringify({
            data: {
              partner: RPM_CONFIG.subdomain,
              bodyType,
            },
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[RPM API] Draft avatar creation failed:', response.status, errorText);
        throw new Error(`Failed to create draft avatar: ${response.status} ${errorText}`);
      }

      const responseData = await response.json();
      console.log('[RPM API] Draft avatar response:', responseData);

      // Extract data from response
      const data = responseData.data || responseData;
      console.log('[RPM API] Draft avatar created:', data.id);

      return AvatarSchema.parse(data);
    } catch (error) {
      console.error('[RPM API] createDraftAvatar error:', error);
      throw error;
    }
  }

  async updateAvatar(avatarId: string, assets: Partial<Avatar['assets']>): Promise<Avatar> {
    try {
      await this.ensureAuthenticated();

      console.log('[RPM API] Updating avatar:', avatarId, 'with assets:', assets);

      // Use the correct endpoint: PUT /v1/avatars/{id}/equip
      // The API expects one asset at a time
      const assetEntries = assets ? Object.values(assets).filter(Boolean) : [];
      const assetId = assetEntries[0]; // Get the first asset ID

      if (!assetId) {
        throw new Error('No asset ID provided');
      }

      const response = await fetch(`${RPM_CONFIG.apiUrl}/v1/avatars/${avatarId}/equip`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': RPM_CONFIG.apiKey,
        },
        body: JSON.stringify({
          data: {
            assetId: assetId,
          },
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[RPM API] Update avatar failed:', response.status, errorText);
        throw new Error(`Failed to update avatar: ${response.status} ${errorText}`);
      }

      // The equip endpoint returns 204 No Content, so we need to fetch the updated avatar
      console.log('[RPM API] Asset equipped successfully. Fetching updated avatar...');

      // Fetch the updated avatar to get the new state
      const avatarResponse = await fetch(`${RPM_CONFIG.apiUrl}/v1/avatars/${avatarId}`, {
        headers: {
          'x-api-key': RPM_CONFIG.apiKey,
        },
      });

      if (!avatarResponse.ok) {
        const errorText = await avatarResponse.text();
        console.error('[RPM API] Failed to fetch updated avatar:', avatarResponse.status, errorText);
        throw new Error(`Failed to fetch updated avatar: ${avatarResponse.status}`);
      }

      const avatarData = await avatarResponse.json();
      console.log('[RPM API] Fetched avatar data:', avatarData);
      const data = avatarData.data || avatarData;

      console.log('[RPM API] Avatar updated successfully');
      return AvatarSchema.parse(data);
    } catch (error) {
      console.error('[RPM API] updateAvatar error:', error);
      throw error;
    }
  }

  async saveAvatar(avatarId: string): Promise<Avatar> {
    try {
      await this.ensureAuthenticated();

      console.log('[RPM API] Saving avatar:', avatarId);
      const response = await fetch(`${RPM_CONFIG.apiUrl}/v2/avatars/${avatarId}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${this.token}`,
          'X-APP-ID': RPM_CONFIG.appId,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[RPM API] Save avatar failed:', response.status, errorText);
        throw new Error(`Failed to save avatar: ${response.status} ${errorText}`);
      }

      const responseData = await response.json();
      console.log('[RPM API] Save avatar response:', responseData);

      // Extract data from response wrapper
      const data = responseData.data || responseData;
      console.log('[RPM API] Avatar saved:', data.id);

      return AvatarSchema.parse(data);
    } catch (error) {
      console.error('[RPM API] saveAvatar error:', error);
      throw error;
    }
  }

  async getAssets(gender?: 'male' | 'female'): Promise<Asset[]> {
    await this.ensureAuthenticated();

    const params = new URLSearchParams({
      filter: 'usable-by-user-and-app',
      filterApplicationId: RPM_CONFIG.appId,
      filterUserId: this.userId!,
    });

    if (gender) {
      params.append('gender', gender);
    }

    const response = await fetch(`${RPM_CONFIG.apiUrl}/v1/assets?${params}`, {
      headers: {
        Authorization: `Bearer ${this.token}`,
        'X-APP-ID': RPM_CONFIG.appId,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch assets');
    }

    const data = await response.json();
    return z.array(AssetSchema).parse(data.data || data);
  }

  getAvatarGlbUrl(avatarId: string, preview: boolean = false): string {
    if (preview) {
      return `${RPM_CONFIG.apiUrl}/v2/avatars/${avatarId}.glb?preview=true`;
    }
    // Add timestamp to bust cache and get the latest version
    const timestamp = Date.now();
    return `${RPM_CONFIG.modelsUrl}/${avatarId}.glb?t=${timestamp}`;
  }

  getToken(): string | null {
    return this.token;
  }
}

// Singleton instance
export const rpmAPI = new ReadyPlayerMeAPI();
